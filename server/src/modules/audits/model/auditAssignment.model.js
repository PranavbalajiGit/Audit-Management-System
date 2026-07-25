const mongoose = require('mongoose');

const auditAssignmentSchema = new mongoose.Schema({
  auditorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Auditor reference is required'],
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: [true, 'Room reference is required'],
  },
  checklistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Checklist',
    required: [true, 'Checklist reference is required'],
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Admin reference is required'],
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
  },
  status: {
    type: String,
    enum: ['Assigned', 'In Progress', 'Submitted', 'Approved', 'Review Required', 'Rejected'],
    default: 'Assigned',
  },
  auditId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Audit',
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AuditAssignment', auditAssignmentSchema);
