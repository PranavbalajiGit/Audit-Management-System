const auditService = require('../service/audit.service');
const { successResponse } = require('../../../shared/response/responseFormatter');
const AppError = require('../../../shared/errors/appError');

// --- Assignments ---

const createAssignment = async (req, res, next) => {
  try {
    const assignmentData = {
      auditorId: req.body.auditorId,
      roomId: req.body.roomId,
      checklistId: req.body.checklistId,
      dueDate: req.body.dueDate,
      assignedBy: req.user._id
    };

    const assignment = await auditService.createAssignment(assignmentData);
    
    // Notify auditor via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(req.body.auditorId).emit('assignment-created', {
        id: assignment._id,
        dueDate: assignment.dueDate
      });
    }

    res.status(201).json(successResponse('Audit assigned successfully', assignment));
  } catch (error) {
    next(error);
  }
};

const getAssignments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const { status } = req.query;
    
    // Auditors only see their own assignments
    const auditorId = req.user.roleId.name === 'Auditor' ? req.user._id : req.query.auditorId;

    const { assignments, total } = await auditService.getAssignments({ auditorId, status }, page, limit);

    res.status(200).json(successResponse('Assignments retrieved successfully', assignments, {
      page,
      limit,
      total
    }));
  } catch (error) {
    next(error);
  }
};

const getAssignmentById = async (req, res, next) => {
  try {
    const assignment = await auditService.getAssignmentById(req.params.id);
    res.status(200).json(successResponse('Assignment retrieved successfully', assignment));
  } catch (error) {
    next(error);
  }
};

// --- Audit Execution ---

const startAudit = async (req, res, next) => {
  try {
    const { assignmentId } = req.body;
    if (!assignmentId) {
      return next(new AppError('Assignment ID is required', 400));
    }

    const audit = await auditService.startAudit(assignmentId, req.user._id);

    // Notify admins in real-time
    const io = req.app.get('io');
    if (io) {
      io.emit('audit-started', {
        auditId: audit._id,
        auditorName: req.user.name,
        roomId: audit.roomId,
        startedAt: new Date()
      });
    }

    res.status(200).json(successResponse('Audit session started', audit));
  } catch (error) {
    next(error);
  }
};

const getAuditById = async (req, res, next) => {
  try {
    const audit = await auditService.getAuditById(req.params.id);
    res.status(200).json(successResponse('Audit details retrieved', audit));
  } catch (error) {
    next(error);
  }
};

const getAudits = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const { status, roomId } = req.query;

    const auditorId = req.user.roleId.name === 'Auditor' ? req.user._id : req.query.auditorId;

    const { audits, total } = await auditService.getAudits({ auditorId, status, roomId }, page, limit);

    res.status(200).json(successResponse('Audits retrieved successfully', audits, {
      page,
      limit,
      total
    }));
  } catch (error) {
    next(error);
  }
};

const verifyQR = async (req, res, next) => {
  try {
    const { auditId, qrToken } = req.body;
    if (!auditId || !qrToken) {
      return next(new AppError('Audit ID and QR token are required', 400));
    }

    const result = await auditService.verifyQR(auditId, qrToken, req.user._id);
    res.status(200).json(successResponse('QR Code verified successfully', result));
  } catch (error) {
    next(error);
  }
};

const verifyGPS = async (req, res, next) => {
  try {
    const { auditId, latitude, longitude, accuracy } = req.body;
    if (!auditId || latitude === undefined || longitude === undefined) {
      return next(new AppError('Audit ID, latitude, and longitude are required', 400));
    }

    const result = await auditService.verifyGPS(auditId, latitude, longitude, accuracy, req.user._id);
    res.status(200).json(successResponse('GPS verification completed', result));
  } catch (error) {
    next(error);
  }
};

const uploadImage = async (req, res, next) => {
  try {
    const { auditId, imageType, latitude, longitude, isLiveCapture, testBypass } = req.body;

    // Prevent uploading from local storage unless test bypass is enabled
    if (String(testBypass) !== 'true' && String(isLiveCapture) !== 'true') {
      return next(new AppError('Uploading images from local storage is strictly prohibited to ensure a transparent audit. Please capture a live image using the camera.', 403));
    }

    if (!auditId) {
      return next(new AppError('Audit ID is required', 400));
    }

    if (!req.fileUrl) {
      return next(new AppError('No image file uploaded', 400));
    }

    const images = await auditService.uploadImage(
      auditId, 
      req.fileUrl, 
      req.fileLocalPath, 
      imageType, 
      req.user._id,
      latitude,
      longitude
    );

    res.status(200).json(successResponse('Image uploaded and linked successfully', images));
  } catch (error) {
    next(error);
  }
};

const deleteImage = async (req, res, next) => {
  try {
    const { auditId, imageUrl, latitude, longitude } = req.body;
    if (!auditId || !imageUrl) {
      return next(new AppError('Audit ID and Image URL are required', 400));
    }

    const images = await auditService.deleteImage(auditId, imageUrl, req.user._id, latitude, longitude);
    res.status(200).json(successResponse('Image removed successfully', images));
  } catch (error) {
    next(error);
  }
};

const runAIAnalysis = async (req, res, next) => {
  try {
    const { auditId, latitude, longitude } = req.body;
    if (!auditId) {
      return next(new AppError('Audit ID is required', 400));
    }

    const result = await auditService.runAIAnalysis(auditId, req.user._id, latitude, longitude);
    res.status(200).json(successResponse('AI analysis and question generation completed', result));
  } catch (error) {
    next(error);
  }
};

const submitAudit = async (req, res, next) => {
  try {
    const { auditId, checklistAnswers, verificationAnswers, latitude, longitude } = req.body;
    if (!auditId) {
      return next(new AppError('Audit ID is required', 400));
    }

    const audit = await auditService.submitAudit(
      auditId, 
      checklistAnswers, 
      verificationAnswers, 
      req.user._id,
      latitude,
      longitude
    );

    // Notify admins in real-time about audit submission
    const io = req.app.get('io');
    if (io) {
      io.emit('audit-submitted', {
        auditId: audit._id,
        auditorName: req.user.name,
        roomId: audit.roomId._id,
        roomNumber: audit.roomId.roomNumber,
        buildingName: audit.roomId.buildingId?.name,
        confidenceScore: audit.confidenceScore,
        status: audit.status
      });
    }

    res.status(200).json(successResponse('Audit submitted successfully', audit));
  } catch (error) {
    next(error);
  }
};

const updateAuditStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const audit = await auditService.updateAuditStatus(req.params.id, status, notes, req.user._id);

    // Notify auditor about status update
    const io = req.app.get('io');
    if (io) {
      io.emit('audit-status-updated', {
        auditId: audit._id,
        status: audit.status,
        notes: audit.notes
      });
    }

    res.status(200).json(successResponse('Audit status updated successfully', audit));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAssignment,
  getAssignments,
  getAssignmentById,
  startAudit,
  getAuditById,
  getAudits,
  verifyQR,
  verifyGPS,
  uploadImage,
  deleteImage,
  runAIAnalysis,
  submitAudit,
  updateAuditStatus
};
