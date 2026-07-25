const buildingRepository = require('../repository/building.repository');
const AppError = require('../../../shared/errors/appError');

class BuildingService {
  async getAllBuildings(filters, page, limit) {
    const dbFilter = {};
    if (filters.search) {
      dbFilter.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { code: { $regex: filters.search, $options: 'i' } }
      ];
    }
    return await buildingRepository.findAll(dbFilter, page, limit);
  }

  async getBuildingById(id) {
    const building = await buildingRepository.findById(id);
    if (!building) {
      throw new AppError('Building not found', 404);
    }
    return building;
  }

  async createBuilding(buildingData) {
    const existing = await buildingRepository.findByCode(buildingData.code);
    if (existing) {
      throw new AppError(`Building with code '${buildingData.code}' already exists`, 400);
    }
    return await buildingRepository.create(buildingData);
  }

  async updateBuilding(id, updateData) {
    const building = await buildingRepository.findById(id);
    if (!building) {
      throw new AppError('Building not found', 404);
    }

    if (updateData.code && updateData.code.toUpperCase() !== building.code) {
      const existing = await buildingRepository.findByCode(updateData.code);
      if (existing) {
        throw new AppError(`Building with code '${updateData.code}' already exists`, 400);
      }
    }

    return await buildingRepository.update(id, updateData);
  }

  async deleteBuilding(id, deletedBy) {
    const building = await buildingRepository.findById(id);
    if (!building) {
      throw new AppError('Building not found', 404);
    }
    return await buildingRepository.softDelete(id, deletedBy);
  }
}

module.exports = new BuildingService();
