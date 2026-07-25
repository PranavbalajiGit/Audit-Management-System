const mongoose = require('mongoose');

const checklistAnswerSchema = new mongoose.Schema({
  questionId: {
    type: String,
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: mongoose.Schema.Types.Mixed, // Boolean, String, Number
    required: true,
  }
}, { _id: false });

const verificationAnswerSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
  validationResult: {
    type: String,
    enum: ['Match', 'Partial match', 'Conflict', 'Requires review'],
    default: 'Requires review',
  }
}, { _id: false });

const gpsDataSchema = new mongoose.Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  accuracy: { type: Number },
  capturedAt: { type: Date, default: Date.now },
  distanceMeters: { type: Number },
  verified: { type: Boolean, default: false }
}, { _id: false });

const auditImageSchema = new mongoose.Schema({
  cloudinaryUrl: { type: String },
  localPath: { type: String },
  capturedAt: { type: Date, default: Date.now },
  imageType: {
    type: String,
    enum: ['Entrance', 'Wide', 'Asset', 'Other'],
    default: 'Other'
  }
}, { _id: false });

const aiAnalysisSchema = new mongoose.Schema({
  roomClassification: { type: String },
  sceneDescription: { type: String },
  objects: [{ type: String }],
  confidence: { type: Number }, // 0 to 1
  analyzedAt: { type: Date, default: Date.now }
}, { _id: false });

const auditSchema = new mongoose.Schema({
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AuditAssignment',
    required: [true, 'Assignment reference is required'],
  },
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
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Submitted', 'Approved', 'Review Required', 'Rejected'],
    default: 'In Progress',
  },
  confidenceScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  qrVerified: {
    type: Boolean,
    default: false
  },
  gpsData: gpsDataSchema,
  images: [auditImageSchema],
  checklistAnswers: [checklistAnswerSchema],
  aiAnalysis: aiAnalysisSchema,
  verificationAnswers: [verificationAnswerSchema],
  submittedAt: {
    type: Date,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  notes: {
    type: String,
    trim: true,
  }
}, {
  timestamps: true
});

// Indexes for performance optimization
auditSchema.index({ auditorId: 1, status: 1 });
auditSchema.index({ roomId: 1 });
auditSchema.index({ submittedAt: -1 });

module.exports = mongoose.model('Audit', auditSchema);
