const express = require('express');
const authRoutes = require('../modules/auth/routes/auth.routes');
const userRoutes = require('../modules/users/routes/user.routes');
const buildingRoutes = require('../modules/buildings/routes/building.routes');
const roomRoutes = require('../modules/rooms/routes/room.routes');
const checklistRoutes = require('../modules/checklists/routes/checklist.routes');
const auditRoutes = require('../modules/audits/routes/audit.routes');
const analyticsRoutes = require('../modules/analytics/routes/analytics.routes');
const reportsRoutes = require('../modules/reports/routes/reports.routes');

const { verifyQR, verifyGPS, uploadImage, runAIAnalysis, submitAudit } = require('../modules/audits/controller/audit.controller');
const { authenticateJWT, requireRole } = require('../middleware/auth.middleware');
const { uploadSingle, handleUpload } = require('../middleware/upload.middleware');

const router = express.Router();

// Register Module Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/buildings', buildingRoutes);
router.use('/rooms', roomRoutes);
router.use('/checklists', checklistRoutes);
router.use('/audits', auditRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/reports', reportsRoutes);

// Flattened/Root routes for specific API endpoints matching 10_API_SPECIFICATION.md
router.post('/qr/verify', authenticateJWT, requireRole(['Auditor']), verifyQR);
router.post('/gps/verify', authenticateJWT, requireRole(['Auditor']), verifyGPS);
router.post('/images/upload', authenticateJWT, requireRole(['Auditor']), uploadSingle, handleUpload, uploadImage);
router.post('/ai/analyze', authenticateJWT, requireRole(['Auditor']), runAIAnalysis);

// Support both /audits/:id/submit and /audits/submit
router.post('/audits/:id/submit', authenticateJWT, requireRole(['Auditor']), (req, res, next) => {
  req.body.auditId = req.params.id;
  submitAudit(req, res, next);
});

module.exports = router;
