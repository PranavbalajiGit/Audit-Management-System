const roomService = require('../service/room.service');
const { successResponse } = require('../../../shared/response/responseFormatter');

const getRooms = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const { buildingId, roomType, search } = req.query;

    const { rooms, total } = await roomService.getAllRooms({ buildingId, roomType, search }, page, limit);

    res.status(200).json(successResponse('Rooms retrieved successfully', rooms, {
      page,
      limit,
      total
    }));
  } catch (error) {
    next(error);
  }
};

const getRoomById = async (req, res, next) => {
  try {
    const room = await roomService.getRoomById(req.params.id);
    res.status(200).json(successResponse('Room retrieved successfully', room));
  } catch (error) {
    next(error);
  }
};

const createRoom = async (req, res, next) => {
  try {
    const room = await roomService.createRoom(req.body);
    res.status(201).json(successResponse('Room created successfully', room));
  } catch (error) {
    next(error);
  }
};

const updateRoom = async (req, res, next) => {
  try {
    const room = await roomService.updateRoom(req.params.id, req.body);
    res.status(200).json(successResponse('Room updated successfully', room));
  } catch (error) {
    next(error);
  }
};

const deleteRoom = async (req, res, next) => {
  try {
    await roomService.deleteRoom(req.params.id, req.user._id);
    res.status(200).json(successResponse('Room deleted successfully'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom
};
