const Room = require('../model/room.model');
const QRCode = require('../model/qrCode.model');
const crypto = require('crypto');

class RoomRepository {
  async findAll(filter = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const query = { isDeleted: { $ne: true }, ...filter };

    const rooms = await Room.find(query)
      .populate('buildingId')
      .populate('qrCodeId')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Room.countDocuments(query);
    return { rooms, total };
  }

  async findById(id) {
    return await Room.findById(id).populate('buildingId').populate('qrCodeId');
  }

  async create(roomData) {
    // Start session if transactional support is available, but for simplicity
    // and maximum compatibility, let's create them sequentially.
    const room = new Room(roomData);
    
    // Generate QR code data
    const qrToken = `ROOM_QR_${room._id}_${crypto.randomBytes(8).toString('hex')}`;
    const qrCode = await QRCode.create({
      roomId: room._id,
      encodedData: qrToken,
      version: '1.0'
    });

    room.qrCodeId = qrCode._id;
    await room.save();
    return await room.populate(['buildingId', 'qrCodeId']);
  }

  async update(id, updateData) {
    return await Room.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('buildingId')
      .populate('qrCodeId');
  }

  async softDelete(id, deletedBy) {
    return await Room.findByIdAndUpdate(id, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy
    }, { new: true });
  }

  async findQRCodeByData(encodedData) {
    return await QRCode.findOne({ encodedData }).populate('roomId');
  }

  async findQRCodeByRoomId(roomId) {
    return await QRCode.findOne({ roomId });
  }
}

module.exports = new RoomRepository();
