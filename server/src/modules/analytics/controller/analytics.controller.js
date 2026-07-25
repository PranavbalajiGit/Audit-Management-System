const analyticsService = require('../service/analytics.service');
const { successResponse } = require('../../../shared/response/responseFormatter');

const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await analyticsService.getDashboardStats();
    res.status(200).json(successResponse('Dashboard statistics fetched successfully', stats));
  } catch (error) {
    next(error);
  }
};

const getTrends = async (req, res, next) => {
  try {
    const trends = await analyticsService.getTrends();
    res.status(200).json(successResponse('Trends statistics fetched successfully', trends));
  } catch (error) {
    next(error);
  }
};

const getAuditorStats = async (req, res, next) => {
  try {
    const stats = await analyticsService.getAuditorStats();
    res.status(200).json(successResponse('Auditor performance metrics fetched successfully', stats));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getTrends,
  getAuditorStats
};
