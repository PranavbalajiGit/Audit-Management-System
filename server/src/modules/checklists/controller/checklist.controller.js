const checklistService = require('../service/checklist.service');
const { successResponse } = require('../../../shared/response/responseFormatter');

const getChecklists = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const { categoryId, search } = req.query;

    const { checklists, total } = await checklistService.getAllChecklists({ categoryId, search }, page, limit);

    res.status(200).json(successResponse('Checklists retrieved successfully', checklists, {
      page,
      limit,
      total
    }));
  } catch (error) {
    next(error);
  }
};

const getChecklistById = async (req, res, next) => {
  try {
    const checklist = await checklistService.getChecklistById(req.params.id);
    res.status(200).json(successResponse('Checklist retrieved successfully', checklist));
  } catch (error) {
    next(error);
  }
};

const createChecklist = async (req, res, next) => {
  try {
    const checklist = await checklistService.createChecklist(req.body);
    res.status(201).json(successResponse('Checklist created successfully', checklist));
  } catch (error) {
    next(error);
  }
};

const updateChecklist = async (req, res, next) => {
  try {
    const checklist = await checklistService.updateChecklist(req.params.id, req.body);
    res.status(200).json(successResponse('Checklist updated successfully', checklist));
  } catch (error) {
    next(error);
  }
};

const deleteChecklist = async (req, res, next) => {
  try {
    await checklistService.deleteChecklist(req.params.id, req.user._id);
    res.status(200).json(successResponse('Checklist deleted successfully'));
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await checklistService.getCategories();
    res.status(200).json(successResponse('Audit categories retrieved successfully', categories));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getChecklists,
  getChecklistById,
  createChecklist,
  updateChecklist,
  deleteChecklist,
  getCategories
};
