'use strict';

const express = require('express');
const router = express.Router();
const { getLogs, toggleLog, getStats, deleteLog } = require('../controllers/logsController');

// All logs routes are protected — auth applied in server.js at mount point

// IMPORTANT: /toggle and /stats MUST come before any /:id-style routes
router.get('/', getLogs);
router.post('/toggle', toggleLog);
router.get('/stats', getStats);
router.delete('/', deleteLog);

module.exports = router;
