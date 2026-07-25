const mongoose = require('mongoose');

const checklistItemSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['boolean', 'text', 'number'],
    default: 'boolean',
  },
  mandatory: {
    type: Boolean,
    default: true,
  }
}, { _id: true });

const checklistSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Checklist title is required'],
    trim: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AuditCategory',
    required: [true, 'Category reference is required'],
  },
  items: [checklistItemSchema],
  isDeleted: {
    type: Boolean,
    default: false,
    select: false,
  },
  deletedAt: {
    type: Date,
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }
}, {
  timestamps: true
});

checklistSchema.pre(/^find/, function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

module.exports = mongoose.model('Checklist', checklistSchema);
