const Checklist = require('../model/checklist.model');
const AuditCategory = require('../model/auditCategory.model');

class ChecklistRepository {
  async findAll(filter = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const query = { isDeleted: { $ne: true }, ...filter };

    const checklists = await Checklist.find(query)
      .populate('categoryId')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Checklist.countDocuments(query);
    return { checklists, total };
  }

  async findById(id) {
    return await Checklist.findById(id).populate('categoryId');
  }

  async create(checklistData) {
    return await Checklist.create(checklistData);
  }

  async update(id, updateData) {
    return await Checklist.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).populate('categoryId');
  }

  async softDelete(id, deletedBy) {
    return await Checklist.findByIdAndUpdate(id, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy
    }, { new: true });
  }

  async findAllCategories() {
    return await AuditCategory.find();
  }

  async findCategoryById(id) {
    return await AuditCategory.findById(id);
  }
}

module.exports = new ChecklistRepository();
