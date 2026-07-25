const buildingService = require('../service/building.service');
const { successResponse } = require('../../../shared/response/responseFormatter');

const getBuildings = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const { search } = req.query;

    const { buildings, total } = await buildingService.getAllBuildings({ search }, page, limit);

    res.status(200).json(successResponse('Buildings retrieved successfully', buildings, {
      page,
      limit,
      total
    }));
  } catch (error) {
    next(error);
  }
};

const getBuildingById = async (req, res, next) => {
  try {
    const building = await buildingService.getBuildingById(req.params.id);
    res.status(200).json(successResponse('Building retrieved successfully', building));
  } catch (error) {
    next(error);
  }
};

const createBuilding = async (req, res, next) => {
  try {
    const building = await buildingService.createBuilding(req.body);
    res.status(201).json(successResponse('Building created successfully', building));
  } catch (error) {
    next(error);
  }
};

const updateBuilding = async (req, res, next) => {
  try {
    const building = await buildingService.updateBuilding(req.params.id, req.body);
    res.status(200).json(successResponse('Building updated successfully', building));
  } catch (error) {
    next(error);
  }
};

const deleteBuilding = async (req, res, next) => {
  try {
    await buildingService.deleteBuilding(req.params.id, req.user._id);
    res.status(200).json(successResponse('Building deleted successfully'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBuildings,
  getBuildingById,
  createBuilding,
  updateBuilding,
  deleteBuilding
};
