const mongoose = require('mongoose');

const auditCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    enum: [
      'Guest House',
      'COE Office',
      'Research and Development Centre',
      'Medical Centre',
      'Radio Station',
      'Classroom',
      'Laboratory',
      'Hostel',
      'Library',
      'Office',
      'Other',
    ],
  },
  description: {
    type: String,
    trim: true,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AuditCategory', auditCategorySchema);
