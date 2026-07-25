const express = require('express');
const { getBuildings, getBuildingById, createBuilding, updateBuilding, deleteBuilding } = require('../controller/building.controller');
const { authenticateJWT, requireRole } = require('../../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticateJWT);

router.get('/', getBuildings);
router.get('/:id', getBuildingById);

// Admin-only operations for editing buildings
router.post('/', requireRole(['Admin']), createBuilding);
router.patch('/:id', requireRole(['Admin']), updateBuilding);
router.delete('/:id', requireRole(['Admin']), deleteBuilding);

module.exports = router;
