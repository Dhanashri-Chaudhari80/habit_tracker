'use strict';

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { register, login, me } = require('../controllers/authController');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected route
router.get('/me', authMiddleware, me);

module.exports = router;
