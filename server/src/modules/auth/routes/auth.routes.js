const express = require('express');
const { login, refreshToken, logout, getProfile } = require('../controller/auth.controller');
const { authenticateJWT } = require('../../../middleware/auth.middleware');

const router = express.Router();

router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', authenticateJWT, logout);
router.get('/profile', authenticateJWT, getProfile);

module.exports = router;
