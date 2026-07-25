const mongoose = require('mongoose');

const auditCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    enum: ['Classroom', 'Laboratory', 'Hostel', 'Library', 'Office', 'Other'],
  },
  description: {
    type: String,
    trim: true,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AuditCategory', auditCategorySchema);
