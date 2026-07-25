const Building = require('../model/building.model');

class BuildingRepository {
  async findAll(filter = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const query = { isDeleted: { $ne: true }, ...filter };
    
    const buildings = await Building.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Building.countDocuments(query);
    return { buildings, total };
  }

  async findById(id) {
    return await Building.findById(id);
  }

  async findByCode(code) {
    return await Building.findOne({ code: code.toUpperCase(), isDeleted: { $ne: true } });
  }

  async create(buildingData) {
    return await Building.create(buildingData);
  }

  async update(id, updateData) {
    return await Building.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  }

  async softDelete(id, deletedBy) {
    return await Building.findByIdAndUpdate(id, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy
    }, { new: true });
  }
}

module.exports = new BuildingRepository();
