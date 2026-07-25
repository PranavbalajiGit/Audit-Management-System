const Audit = require('../model/audit.model');
const AuditAssignment = require('../model/auditAssignment.model');

class AuditRepository {
  // --- Audit Assignment Methods ---

  async createAssignment(assignmentData) {
    return await AuditAssignment.create(assignmentData);
  }

  async findAssignments(filter = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const assignments = await AuditAssignment.find(filter)
      .populate('auditorId')
      .populate({
        path: 'roomId',
        populate: { path: 'buildingId' }
      })
      .populate('checklistId')
      .populate('assignedBy')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await AuditAssignment.countDocuments(filter);
    return { assignments, total };
  }

  async findAssignmentById(id) {
    return await AuditAssignment.findById(id)
      .populate('auditorId')
      .populate({
        path: 'roomId',
        populate: { path: 'buildingId' }
      })
      .populate('checklistId')
      .populate('assignedBy');
  }

  async updateAssignment(id, updateData) {
    return await AuditAssignment.findByIdAndUpdate(id, updateData, { new: true });
  }

  // --- Audit Execution Methods ---

  async createAudit(auditData) {
    return await Audit.create(auditData);
  }

  async findAudits(filter = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const audits = await Audit.find(filter)
      .populate('auditorId')
      .populate({
        path: 'roomId',
        populate: { path: 'buildingId' }
      })
      .populate('assignmentId')
      .skip(skip)
      .limit(limit)
      .sort({ submittedAt: -1, createdAt: -1 });

    const total = await Audit.countDocuments(filter);
    return { audits, total };
  }

  async findAuditById(id) {
    return await Audit.findById(id)
      .populate('auditorId')
      .populate({
        path: 'roomId',
        populate: { path: 'buildingId' }
      })
      .populate({
        path: 'assignmentId',
        populate: { path: 'checklistId' }
      });
  }

  async updateAudit(id, updateData) {
    return await Audit.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('auditorId')
      .populate({
        path: 'roomId',
        populate: { path: 'buildingId' }
      });
  }

  async findActiveAuditByAssignment(assignmentId) {
    return await Audit.findOne({ assignmentId, status: 'In Progress' });
  }
}

module.exports = new AuditRepository();
