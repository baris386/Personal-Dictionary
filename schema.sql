-- Turso (LibSQL / SQLite) Database Schema for Personal English Vocabulary Database
-- Run this in Turso CLI using: turso db shell <your-db-name> < schema.sql

CREATE TABLE IF NOT EXISTS entries (
    id TEXT PRIMARY KEY,
    word TEXT NOT NULL UNIQUE,
    pos TEXT NOT NULL DEFAULT 'Idiom',
    az_meaning TEXT NOT NULL,
    definition TEXT,
    tone_context TEXT,
    synonyms TEXT, -- JSON array of strings e.g. ["furious", "mad"]
    antonyms TEXT, -- JSON array of strings e.g. ["calm"]
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Seed Sample Data (Optional)
INSERT OR IGNORE INTO entries (id, word, pos, az_meaning, definition, tone_context, synonyms, antonyms, notes)
VALUES 
(
    'angry',
    'Angry',
    'Adjective',
    'Qəzəbli, hirsli',
    'Feeling or showing strong annoyance, displeasure, or hostility.',
    'Everyday Spoken',
    '["furious", "mad"]',
    '["calm", "happy"]',
    'Standard word for displeasure.'
),
(
    'furious',
    'Furious',
    'Adjective',
    'Çox qəzəbli, şiddətli hirsli',
    'Extremely angry; full of fury.',
    'Informal / Emotional',
    '["angry", "enraged"]',
    '["calm", "peaceful"]',
    'Stronger intensity than angry.'
);
