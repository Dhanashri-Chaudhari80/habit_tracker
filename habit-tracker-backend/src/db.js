'use strict';

const Database = require('better-sqlite3');
const path = require('path');

// Resolve DB path relative to the project root (where the process is started)
const dbPath = path.resolve(process.cwd(), process.env.DB_PATH || './habit_tracker.db');

const db = new Database(dbPath);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

// Enforce foreign key constraints
db.pragma('foreign_keys = ON');

module.exports = db;
