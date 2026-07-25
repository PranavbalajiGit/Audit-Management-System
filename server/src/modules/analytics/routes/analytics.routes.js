const express = require('express');
const { getDashboardStats, getTrends, getAuditorStats } = require('../controller/analytics.controller');
const { authenticateJWT, requireRole } = require('../../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticateJWT);
router.use(requireRole(['Admin']));

router.get('/dashboard', getDashboardStats);
router.get('/trends', getTrends);
router.get('/auditors', getAuditorStats);

module.exports = router;
