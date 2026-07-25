const mongoose = require('mongoose');

const qrCodeSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  encodedData: {
    type: String,
    required: true,
    unique: true,
  },
  version: {
    type: String,
    default: '1.0',
  },
  generatedAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('QRCode', qrCodeSchema);
