const express = require('express');
const { getUsers, getUserById, createUser, updateUser, deleteUser, getRoles } = require('../controller/user.controller');
const { authenticateJWT, requireRole } = require('../../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticateJWT);

// Admin-only operations
router.get('/', requireRole(['Admin']), getUsers);
router.post('/', requireRole(['Admin']), createUser);
router.get('/roles', requireRole(['Admin']), getRoles);
router.get('/:id', requireRole(['Admin']), getUserById);
router.patch('/:id', requireRole(['Admin']), updateUser);
router.delete('/:id', requireRole(['Admin']), deleteUser);

module.exports = router;
