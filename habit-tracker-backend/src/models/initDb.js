'use strict';

// Load env vars before importing db so DB_PATH is available
require('dotenv').config();

const db = require('../db');

/**
 * Creates all required tables if they don't already exist.
 * Safe to call on every startup — fully idempotent.
 */
function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name          TEXT NOT NULL,
      created_at    TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS habits (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      name        TEXT NOT NULL,
      emoji       TEXT DEFAULT '✅',
      frequency   INTEGER DEFAULT 7,
      sort_order  INTEGER DEFAULT 0,
      created_at  TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS habit_logs (
      id          TEXT PRIMARY KEY,
      habit_id    TEXT NOT NULL,
      user_id     TEXT NOT NULL,
      date        TEXT NOT NULL,
      completed   INTEGER DEFAULT 0,
      UNIQUE(habit_id, date),
      FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE
    );
  `);

  console.log('✅ Database initialised — all tables ready.');
}

module.exports = initDb;

// Allow direct invocation: `node src/models/initDb.js`
if (require.main === module) {
  initDb();
  process.exit(0);
}
