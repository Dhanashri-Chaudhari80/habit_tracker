'use strict';

const express = require('express');
const router = express.Router();
const { getHabits, createHabit, reorderHabits, updateHabit, deleteHabit } = require('../controllers/habitsController');

// All habits routes are protected — auth applied in server.js at mount point

// IMPORTANT: /reorder MUST come before /:id so Express doesn't treat "reorder" as an ID param
router.get('/', getHabits);
router.post('/', createHabit);
router.put('/reorder', reorderHabits);
router.put('/:id', updateHabit);
router.delete('/:id', deleteHabit);

module.exports = router;
