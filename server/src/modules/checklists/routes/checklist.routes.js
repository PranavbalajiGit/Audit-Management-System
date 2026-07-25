const express = require('express');
const { getChecklists, getChecklistById, createChecklist, updateChecklist, deleteChecklist, getCategories } = require('../controller/checklist.controller');
const { authenticateJWT, requireRole } = require('../../../middleware/auth.middleware');

const router = Router = express.Router();

router.use(authenticateJWT);

// Publicly readable for authenticated users (auditors need to fetch checklists for assignments)
router.get('/', getChecklists);
router.get('/categories', getCategories);
router.get('/:id', getChecklistById);

// Admin-only operations for template editing
router.post('/', requireRole(['Admin']), createChecklist);
router.patch('/:id', requireRole(['Admin']), updateChecklist);
router.delete('/:id', requireRole(['Admin']), deleteChecklist);

module.exports = router;
