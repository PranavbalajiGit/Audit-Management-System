const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  buildingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Building',
    required: [true, 'Building reference is required'],
  },
  roomNumber: {
    type: String,
    required: [true, 'Room number is required'],
    trim: true,
  },
  roomType: {
    type: String,
    required: [true, 'Room type is required'],
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
  latitude: {
    type: Number,
    required: [true, 'Latitude coordinate is required'],
  },
  longitude: {
    type: Number,
    required: [true, 'Longitude coordinate is required'],
  },
  referenceImages: [{
    type: String, // Cloudinary URLs
  }],
  qrCodeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QRCode',
  },
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

// Composite unique index for roomNumber per building
roomSchema.index({ buildingId: 1, roomNumber: 1 }, { unique: true });

roomSchema.pre(/^find/, function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

module.exports = mongoose.model('Room', roomSchema);
