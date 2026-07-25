const express = require('express');
const Audit = require('../../audits/model/audit.model');
const { successResponse } = require('../../../shared/response/responseFormatter');
const { authenticateJWT } = require('../../../middleware/auth.middleware');
const AppError = require('../../../shared/errors/appError');

const router = express.Router();

router.use(authenticateJWT);

// Get list of submitted audits (which are the audit reports)
router.get('/', async (req, res, next) => {
  try {
    const audits = await Audit.find({ status: { $ne: 'In Progress' } })
      .populate('auditorId')
      .populate({
        path: 'roomId',
        populate: { path: 'buildingId' }
      })
      .populate({
        path: 'assignmentId',
        populate: { path: 'checklistId' }
      })
      .sort({ submittedAt: -1 });

    res.status(200).json(successResponse('Reports retrieved successfully', audits));
  } catch (error) {
    next(error);
  }
});

// Get individual audit report details
router.get('/:id', async (req, res, next) => {
  try {
    const audit = await Audit.findById(req.params.id)
      .populate('auditorId')
      .populate({
        path: 'roomId',
        populate: { path: 'buildingId' }
      })
      .populate({
        path: 'assignmentId',
        populate: { path: 'checklistId' }
      });

    if (!audit) {
      return next(new AppError('Report not found', 404));
    }

    res.status(200).json(successResponse('Report details retrieved successfully', audit));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
