const express = require('express');
const { 
  createAssignment, 
  getAssignments, 
  getAssignmentById, 
  startAudit, 
  getAuditById, 
  getAudits, 
  verifyQR, 
  verifyGPS, 
  uploadImage, 
  deleteImage, 
  runAIAnalysis, 
  submitAudit, 
  updateAuditStatus 
} = require('../controller/audit.controller');

const { authenticateJWT, requireRole } = require('../../../middleware/auth.middleware');
const { uploadSingle, handleUpload } = require('../../../middleware/upload.middleware');

const router = express.Router();

router.use(authenticateJWT);

// Audit assignments (Create = Admin only, view = both)
router.post('/assignments', requireRole(['Admin']), createAssignment);
router.get('/assignments', getAssignments);
router.get('/assignments/:id', getAssignmentById);

// Audit execution routes (available to Auditors)
router.post('/start', requireRole(['Auditor']), startAudit);
router.post('/qr/verify', requireRole(['Auditor']), verifyQR);
router.post('/gps/verify', requireRole(['Auditor']), verifyGPS);
router.post('/images/upload', requireRole(['Auditor']), uploadSingle, handleUpload, uploadImage);
router.post('/images/delete', requireRole(['Auditor']), deleteImage);
router.post('/ai/analyze', requireRole(['Auditor']), runAIAnalysis);
router.post('/submit', requireRole(['Auditor']), submitAudit);

// Audit listings & manual approval (Admins)
router.get('/', getAudits);
router.get('/:id', getAuditById);
router.patch('/:id/status', requireRole(['Admin']), updateAuditStatus);

module.exports = router;
