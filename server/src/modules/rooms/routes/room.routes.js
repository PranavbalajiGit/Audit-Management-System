const express = require('express');
const { getRooms, getRoomById, createRoom, updateRoom, deleteRoom } = require('../controller/room.controller');
const { authenticateJWT, requireRole } = require('../../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticateJWT);

router.get('/', getRooms);
router.get('/:id', getRoomById);

// Admin-only operations for managing rooms
router.post('/', requireRole(['Admin']), createRoom);
router.patch('/:id', requireRole(['Admin']), updateRoom);
router.delete('/:id', requireRole(['Admin']), deleteRoom);

module.exports = router;
