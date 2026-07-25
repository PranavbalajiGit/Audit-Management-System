const checklistRepository = require('../repository/checklist.repository');
const AppError = require('../../../shared/errors/appError');

class ChecklistService {
  async getAllChecklists(filters, page, limit) {
    const dbFilter = {};
    if (filters.categoryId) {
      dbFilter.categoryId = filters.categoryId;
    }
    if (filters.search) {
      dbFilter.title = { $regex: filters.search, $options: 'i' };
    }
    return await checklistRepository.findAll(dbFilter, page, limit);
  }

  async getChecklistById(id) {
    const checklist = await checklistRepository.findById(id);
    if (!checklist) {
      throw new AppError('Checklist not found', 404);
    }
    return checklist;
  }

  async createChecklist(checklistData) {
    const category = await checklistRepository.findCategoryById(checklistData.categoryId);
    if (!category) {
      throw new AppError('Associated audit category not found', 404);
    }
    return await checklistRepository.create(checklistData);
  }

  async updateChecklist(id, updateData) {
    const checklist = await checklistRepository.findById(id);
    if (!checklist) {
      throw new AppError('Checklist not found', 404);
    }

    if (updateData.categoryId) {
      const category = await checklistRepository.findCategoryById(updateData.categoryId);
      if (!category) {
        throw new AppError('Associated audit category not found', 404);
      }
    }

    return await checklistRepository.update(id, updateData);
  }

  async deleteChecklist(id, deletedBy) {
    const checklist = await checklistRepository.findById(id);
    if (!checklist) {
      throw new AppError('Checklist not found', 404);
    }
    return await checklistRepository.softDelete(id, deletedBy);
  }

  async getCategories() {
    return await checklistRepository.findAllCategories();
  }
}

module.exports = new ChecklistService();
