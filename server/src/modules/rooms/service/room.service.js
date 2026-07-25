const roomRepository = require('../repository/room.repository');
const Building = require('../../buildings/model/building.model');
const AppError = require('../../../shared/errors/appError');

class RoomService {
  async getAllRooms(filters, page, limit) {
    const dbFilter = {};
    if (filters.buildingId) {
      dbFilter.buildingId = filters.buildingId;
    }
    if (filters.roomType) {
      dbFilter.roomType = filters.roomType;
    }
    if (filters.search) {
      dbFilter.roomNumber = { $regex: filters.search, $options: 'i' };
    }
    return await roomRepository.findAll(dbFilter, page, limit);
  }

  async getRoomById(id) {
    const room = await roomRepository.findById(id);
    if (!room) {
      throw new AppError('Room not found', 404);
    }
    return room;
  }

  async createRoom(roomData) {
    // Check building exists
    const building = await Building.findById(roomData.buildingId);
    if (!building) {
      throw new AppError('Associated building not found', 404);
    }
    return await roomRepository.create(roomData);
  }

  async updateRoom(id, updateData) {
    const room = await roomRepository.findById(id);
    if (!room) {
      throw new AppError('Room not found', 404);
    }

    if (updateData.buildingId) {
      const building = await Building.findById(updateData.buildingId);
      if (!building) {
        throw new AppError('Associated building not found', 404);
      }
    }

    return await roomRepository.update(id, updateData);
  }

  async deleteRoom(id, deletedBy) {
    const room = await roomRepository.findById(id);
    if (!room) {
      throw new AppError('Room not found', 404);
    }
    return await roomRepository.softDelete(id, deletedBy);
  }
}

module.exports = new RoomService();
