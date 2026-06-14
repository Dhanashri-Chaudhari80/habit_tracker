'use strict';

const { v4: uuidv4 } = require('uuid');
const db = require('../db');

// ─── GET /api/habits ──────────────────────────────────────────────────────────

function getHabits(req, res, next) {
  try {
    const habits = db.prepare(
      'SELECT id, name, emoji, frequency, sort_order, created_at FROM habits WHERE user_id = ? ORDER BY sort_order ASC'
    ).all(req.user.id);

    return res.status(200).json({ habits });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/habits ─────────────────────────────────────────────────────────

function createHabit(req, res, next) {
  try {
    const { name, emoji = '✅', frequency = 7 } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Missing field', message: 'name is required.' });
    }

    const freq = parseInt(frequency, 10);
    if (isNaN(freq) || freq < 1 || freq > 7) {
      return res.status(400).json({ error: 'Invalid frequency', message: 'frequency must be an integer between 1 and 7.' });
    }

    // Get current max sort_order for this user
    const maxRow = db.prepare(
      'SELECT MAX(sort_order) AS max_order FROM habits WHERE user_id = ?'
    ).get(req.user.id);
    const sortOrder = (maxRow.max_order !== null ? maxRow.max_order : -1) + 1;

    const id = uuidv4();

    db.prepare(
      'INSERT INTO habits (id, user_id, name, emoji, frequency, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, req.user.id, name.trim(), emoji.trim(), freq, sortOrder);

    const habit = db.prepare(
      'SELECT id, name, emoji, frequency, sort_order, created_at FROM habits WHERE id = ?'
    ).get(id);

    return res.status(201).json({ habit });
  } catch (err) {
    next(err);
  }
}

// ─── PUT /api/habits/reorder ─────────────────────────────────────────────────
// IMPORTANT: This route must be registered BEFORE /:id in Express

function reorderHabits(req, res, next) {
  try {
    const { order } = req.body;

    if (!Array.isArray(order) || order.length === 0) {
      return res.status(400).json({ error: 'Invalid body', message: 'order must be a non-empty array of habit IDs.' });
    }

    const updateStmt = db.prepare(
      'UPDATE habits SET sort_order = ? WHERE id = ? AND user_id = ?'
    );

    // Run all updates atomically inside a transaction
    const runTransaction = db.transaction((ids) => {
      ids.forEach((id, index) => {
        updateStmt.run(index, id, req.user.id);
      });
    });

    runTransaction(order);

    return res.status(200).json({ message: 'Order updated' });
  } catch (err) {
    next(err);
  }
}

// ─── PUT /api/habits/:id ──────────────────────────────────────────────────────

function updateHabit(req, res, next) {
  try {
    const { id } = req.params;

    // Verify ownership
    const existing = db.prepare(
      'SELECT id FROM habits WHERE id = ? AND user_id = ?'
    ).get(id, req.user.id);

    if (!existing) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    const { name, emoji, frequency, sort_order } = req.body;

    // Build dynamic SET clause — only update provided fields
    const fields = [];
    const values = [];

    if (name !== undefined) {
      if (!name.trim()) return res.status(400).json({ error: 'Invalid value', message: 'name cannot be empty.' });
      fields.push('name = ?');
      values.push(name.trim());
    }
    if (emoji !== undefined) {
      fields.push('emoji = ?');
      values.push(emoji.trim());
    }
    if (frequency !== undefined) {
      const freq = parseInt(frequency, 10);
      if (isNaN(freq) || freq < 1 || freq > 7) {
        return res.status(400).json({ error: 'Invalid frequency', message: 'frequency must be between 1 and 7.' });
      }
      fields.push('frequency = ?');
      values.push(freq);
    }
    if (sort_order !== undefined) {
      fields.push('sort_order = ?');
      values.push(parseInt(sort_order, 10));
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update', message: 'Provide at least one of: name, emoji, frequency, sort_order.' });
    }

    values.push(id, req.user.id); // WHERE clause params
    db.prepare(
      `UPDATE habits SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`
    ).run(...values);

    const updated = db.prepare(
      'SELECT id, name, emoji, frequency, sort_order, created_at FROM habits WHERE id = ?'
    ).get(id);

    return res.status(200).json({ habit: updated });
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /api/habits/:id ───────────────────────────────────────────────────

function deleteHabit(req, res, next) {
  try {
    const { id } = req.params;

    const existing = db.prepare(
      'SELECT id FROM habits WHERE id = ? AND user_id = ?'
    ).get(id, req.user.id);

    if (!existing) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    // Cascade in schema will also remove habit_logs rows
    db.prepare('DELETE FROM habits WHERE id = ? AND user_id = ?').run(id, req.user.id);

    return res.status(200).json({ message: 'Habit deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getHabits, createHabit, reorderHabits, updateHabit, deleteHabit };
