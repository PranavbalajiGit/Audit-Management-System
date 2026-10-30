const auditRepository = require('../repository/audit.repository');
const roomRepository = require('../../rooms/repository/room.repository');
const User = require('../../users/model/user.model');
const Checklist = require('../../checklists/model/checklist.model');
const aiService = require('../../../shared/ai/ai.service');
const AppError = require('../../../shared/errors/appError');

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metres
  const phi1 = lat1 * Math.PI/180;
  const phi2 = lat2 * Math.PI/180;
  const deltaPhi = (lat2-lat1) * Math.PI/180;
  const deltaLambda = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in metres
}

class AuditService {
  /**
   * Read an audit image from its local path as base64 (no data URI).
   * Returns null when no local file is available (e.g. remote Cloudinary URL).
   */
  readImageAsBase64(image) {
    if (!image || !image.localPath) {
      return null;
    }
    try {
      const fs = require('fs');
      return fs.readFileSync(image.localPath).toString('base64');
    } catch (err) {
      console.error('[Audit] Failed to read local image file', err.message);
      return null;
    }
  }

  // --- Helper: Continuous Location Enforcement ---
  async enforceLocation(audit, latitude, longitude) {
    if (latitude === undefined || longitude === undefined) {
      throw new AppError('Current location coordinates (latitude, longitude) are required to perform this action to prevent location spoofing.', 400);
    }
    
    if (audit.roomId.latitude && audit.roomId.longitude) {
      const distance = haversineDistance(latitude, longitude, audit.roomId.latitude, audit.roomId.longitude);
      const tolerance = parseInt(process.env.GPS_TOLERANCE_METERS, 10) || 50;
      
      if (distance > tolerance) {
        // Auditor moved away, reset the pipeline
        audit.qrVerified = false;
        if (audit.gpsData) {
          audit.gpsData.verified = false;
        }
        audit.images = [];
        audit.checklistAnswers = [];
        audit.verificationAnswers = [];
        audit.aiAnalysis = undefined;
        await audit.save();
        
        throw new AppError('Security Alert: You moved away from the target location. Audit progress reset. Please start from QR verification again.', 403);
      }
    }
  }

  // --- Assignment Logic ---

  async createAssignment(assignmentData) {
    // Validate target room
    const room = await roomRepository.findById(assignmentData.roomId);
    if (!room) {
      throw new AppError('Target room not found', 404);
    }

    // Validate auditor
    const auditor = await User.findById(assignmentData.auditorId).populate('roleId');
    if (!auditor || auditor.roleId.name !== 'Auditor') {
      throw new AppError('Target user is not a valid auditor', 400);
    }

    // Validate checklist
    const checklist = await Checklist.findById(assignmentData.checklistId);
    if (!checklist) {
      throw new AppError('Checklist template not found', 404);
    }

    // Check if room category aligns with checklist category
    if (String(room.roomType || '').trim().toLowerCase() !== String(checklist.categoryId?.name || '').trim().toLowerCase()) {
      // Allow it but log/warn, or enforce it
      console.warn(`[Assignment Warning] Room type (${room.roomType}) differs from Checklist category (${checklist.categoryId?.name})`);
    }

    return await auditRepository.createAssignment(assignmentData);
  }

  async getAssignments(filters, page, limit) {
    const dbFilter = {};
    if (filters.auditorId) {
      dbFilter.auditorId = filters.auditorId;
    }
    if (filters.status) {
      dbFilter.status = filters.status;
    }
    return await auditRepository.findAssignments(dbFilter, page, limit);
  }

  async getAssignmentById(id) {
    const assignment = await auditRepository.findAssignmentById(id);
    if (!assignment) {
      throw new AppError('Assignment not found', 404);
    }
    return assignment;
  }

  // --- Audit Execution Workflow ---

  async startAudit(assignmentId, auditorId) {
    const assignment = await auditRepository.findAssignmentById(assignmentId);
    if (!assignment) {
      throw new AppError('Assignment not found', 404);
    }

    if (assignment.auditorId._id.toString() !== auditorId.toString()) {
      throw new AppError('You are not authorized to start this audit', 403);
    }

    // Check if an In Progress audit already exists
    let audit = await auditRepository.findActiveAuditByAssignment(assignmentId);
    if (!audit) {
      // Create new Audit document
      audit = await auditRepository.createAudit({
        assignmentId,
        auditorId,
        roomId: assignment.roomId._id,
        status: 'In Progress',
        confidenceScore: 0,
        qrVerified: false,
        images: [],
        checklistAnswers: [],
        verificationAnswers: []
      });

      // Update assignment
      assignment.status = 'In Progress';
      assignment.auditId = audit._id;
      await assignment.save();
    }

    return audit;
  }

  async getAuditById(id) {
    const audit = await auditRepository.findAuditById(id);
    if (!audit) {
      throw new AppError('Audit not found', 404);
    }
    return audit;
  }

  async getAudits(filters, page, limit) {
    const dbFilter = {};
    if (filters.auditorId) {
      dbFilter.auditorId = filters.auditorId;
    }
    if (filters.status) {
      dbFilter.status = filters.status;
    }
    if (filters.roomId) {
      dbFilter.roomId = filters.roomId;
    }
    return await auditRepository.findAudits(dbFilter, page, limit);
  }

  async verifyQR(auditId, qrToken, auditorId) {
    const audit = await auditRepository.findAuditById(auditId);
    if (!audit) {
      throw new AppError('Audit session not found', 404);
    }

    if (audit.auditorId._id.toString() !== auditorId.toString()) {
      throw new AppError('Unauthorized', 403);
    }

    // Look up QR Code record
    const qrRecord = await roomRepository.findQRCodeByData(qrToken);
    if (!qrRecord || qrRecord.roomId._id.toString() !== audit.roomId._id.toString()) {
      throw new AppError('Invalid QR Code. Does not match target room.', 400);
    }

    audit.qrVerified = true;
    await audit.save();
    return { success: true, qrVerified: true };
  }

  async verifyGPS(auditId, latitude, longitude, accuracy, auditorId) {
    const audit = await auditRepository.findAuditById(auditId);
    if (!audit) {
      throw new AppError('Audit session not found', 404);
    }

    if (audit.auditorId._id.toString() !== auditorId.toString()) {
      throw new AppError('Unauthorized', 403);
    }

    const room = audit.roomId;
    if (!room.latitude || !room.longitude) {
      throw new AppError('Target room GPS coordinates not registered by administrator', 400);
    }

    // Calculate distance
    const distance = haversineDistance(latitude, longitude, room.latitude, room.longitude);
    const tolerance = parseInt(process.env.GPS_TOLERANCE_METERS, 10) || 50;
    const verified = distance <= tolerance;

    audit.gpsData = {
      latitude,
      longitude,
      accuracy,
      distanceMeters: Math.round(distance),
      verified,
      capturedAt: new Date()
    };

    await audit.save();

    if (!verified) {
      // Auditor moved away, reset the pipeline
      audit.qrVerified = false;
      audit.images = [];
      audit.checklistAnswers = [];
      audit.verificationAnswers = [];
      audit.aiAnalysis = undefined;
      await audit.save();
      
      throw new AppError('Security Alert: You are not at the target location. Audit progress reset. Please start from QR verification again.', 403);
    }

    return {
      distanceMeters: Math.round(distance),
      tolerance,
      verified
    };
  }

  async uploadImage(auditId, fileUrl, localPath, imageType, auditorId, latitude, longitude) {
    const audit = await auditRepository.findAuditById(auditId);
    if (!audit) {
      throw new AppError('Audit session not found', 404);
    }

    if (audit.auditorId._id.toString() !== auditorId.toString()) {
      throw new AppError('Unauthorized', 403);
    }

    // Enforce Location Tracker
    await this.enforceLocation(audit, latitude, longitude);

    audit.images.push({
      cloudinaryUrl: fileUrl,
      localPath,
      imageType: imageType || 'Other',
      capturedAt: new Date()
    });

    await audit.save();
    return audit.images;
  }

  async deleteImage(auditId, imageUrl, auditorId, latitude, longitude) {
    const audit = await auditRepository.findAuditById(auditId);
    if (!audit) {
      throw new AppError('Audit session not found', 404);
    }

    if (audit.auditorId._id.toString() !== auditorId.toString()) {
      throw new AppError('Unauthorized', 403);
    }

    // Enforce Location Tracker
    await this.enforceLocation(audit, latitude, longitude);

    audit.images = audit.images.filter(img => img.cloudinaryUrl !== imageUrl);
    await audit.save();
    return audit.images;
  }

  async runAIAnalysis(auditId, auditorId, latitude, longitude) {
    const audit = await auditRepository.findAuditById(auditId);
    if (!audit) {
      throw new AppError('Audit session not found', 404);
    }

    if (audit.auditorId._id.toString() !== auditorId.toString()) {
      throw new AppError('Unauthorized', 403);
    }

    // Enforce Location Tracker
    await this.enforceLocation(audit, latitude, longitude);

    if (audit.images.length === 0) {
      throw new AppError('Please upload at least one room image before running AI analysis', 400);
    }

    // Pass ALL uploaded images for comprehensive VLM analysis
    const base64Images = audit.images.map(img => this.readImageAsBase64(img)).filter(b64 => b64);
    const imageUrls = audit.images.map(img => img.cloudinaryUrl);

    const roomType = audit.roomId.roomType;
    console.log(`[AI Analysis] audit=${auditId} provider=${aiService.provider} roomType=${roomType} imageCount=${audit.images.length}`);
    
    // Call VLM Analysis
    const analysis = await aiService.analyzeImage(imageUrls, roomType, base64Images.length > 0 ? base64Images : null);

    audit.aiAnalysis = {
      roomClassification: analysis.roomClassification,
      sceneDescription: analysis.sceneDescription,
      objects: analysis.objects,
      confidence: analysis.confidence,
      analyzedAt: new Date()
    };

    await audit.save();

    // Trigger Dynamic Question Generation based on checklist title and AI findings
    const checklistTitle = audit.assignmentId.checklistId.title;
    const questions = await aiService.generateQuestions(analysis, checklistTitle);

    audit.verificationAnswers = questions.map(q => ({
      question: q.question,
      answer: '',
      validationResult: 'Requires review'
    }));

    await audit.save();

    return {
      aiAnalysis: audit.aiAnalysis,
      verificationQuestions: questions,
      provider: aiService.isMock ? 'mock' : aiService.provider,
      model: aiService.provider === 'ollama' ? aiService.ollamaModel : null
    };
  }

  async submitAudit(auditId, checklistAnswers, verificationAnswers, auditorId, latitude, longitude) {
    const audit = await auditRepository.findAuditById(auditId);
    if (!audit) {
      throw new AppError('Audit session not found', 404);
    }

    if (audit.auditorId._id.toString() !== auditorId.toString()) {
      throw new AppError('Unauthorized', 403);
    }

    if (audit.status !== 'In Progress') {
      throw new AppError('Audit has already been submitted or completed', 400);
    }

    // Continuous Geolocation Enforcement during Submission
    await this.enforceLocation(audit, latitude, longitude);

    // Validate checklist structure matches the assignment checklist
    const assignment = audit.assignmentId;
    const checklist = assignment.checklistId;

    if (!Array.isArray(checklistAnswers) || checklistAnswers.length === 0) {
      throw new AppError('Checklist answers are required', 400);
    }

    // Check mandatory items
    for (const item of checklist.items) {
      if (item.mandatory) {
        const answered = checklistAnswers.find(ans => ans.questionId === item._id.toString());
        if (!answered || answered.answer === undefined || answered.answer === null) {
          throw new AppError(`Mandatory checklist question "${item.question}" is not answered`, 400);
        }
      }
    }

    // Update checklist answers on audit
    audit.checklistAnswers = checklistAnswers;

    // Validate dynamic question answers
    if (!audit.aiAnalysis || !audit.aiAnalysis.roomClassification) {
      throw new AppError('AI image analysis must be executed before final submission', 400);
    }

    if (!Array.isArray(verificationAnswers) || verificationAnswers.length !== audit.verificationAnswers.length) {
      throw new AppError('All AI-generated verification questions must be answered', 400);
    }

    // Validate answers using AI (re-check against the room image when available)
    console.log('[Audit Submission] AI validating dynamic answers...');
    const targetImage = audit.images.find(img => img.imageType === 'Wide' || img.imageType === 'Entrance') || audit.images[0];
    const base64Image = this.readImageAsBase64(targetImage);
    const validated = await aiService.validateAnswers(verificationAnswers, audit.aiAnalysis, base64Image);
    audit.verificationAnswers = validated;

    // Calculate final confidence score
    const signals = {
      qrVerified: audit.qrVerified,
      gpsVerified: audit.gpsData?.verified || false,
      gpsDistance: audit.gpsData?.distanceMeters || 9999,
      vlmRoomType: audit.aiAnalysis.roomClassification,
      vlmConfidence: audit.aiAnalysis.confidence,
      expectedRoomType: audit.roomId.roomType,
      validationAnswers: validated
    };

    const confidenceScore = aiService.calculateConfidence(signals);
    audit.confidenceScore = confidenceScore;
    audit.submittedAt = new Date();

    // Determine final status based on thresholds
    // >= 90: Approved, 70-89: Review Required, < 70: Rejected
    let finalStatus = 'Review Required';
    if (confidenceScore >= 90) {
      finalStatus = 'Approved';
    } else if (confidenceScore < 70) {
      finalStatus = 'Rejected';
    }

    audit.status = finalStatus;
    await audit.save();

    // Update assignment status
    assignment.status = finalStatus;
    await assignment.save();

    return audit;
  }

  async updateAuditStatus(auditId, status, notes, adminId) {
    const audit = await auditRepository.findAuditById(auditId);
    if (!audit) {
      throw new AppError('Audit not found', 404);
    }

    if (!['Approved', 'Rejected', 'Review Required'].includes(status)) {
      throw new AppError('Invalid status value', 400);
    }

    audit.status = status;
    audit.notes = notes || audit.notes;
    audit.approvedBy = adminId;
    await audit.save();

    // Update assignment
    const assignment = await auditRepository.findAssignmentById(audit.assignmentId);
    if (assignment) {
      assignment.status = status;
      await assignment.save();
    }

    return audit;
  }
}

module.exports = new AuditService();
