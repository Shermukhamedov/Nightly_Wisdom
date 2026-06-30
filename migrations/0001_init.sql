-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY,
    language TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Meanings table
CREATE TABLE IF NOT EXISTS meanings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER NOT NULL,
    language TEXT NOT NULL,
    meaning TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(message_id, language)
);

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
    user_id INTEGER PRIMARY KEY
);

-- Quotes table for indexing channel posts
CREATE TABLE IF NOT EXISTS quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER NOT NULL UNIQUE,
    content TEXT,
    language TEXT,
    media_type TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Contributions table for tracking user contributions
CREATE TABLE IF NOT EXISTS contributions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content_type TEXT NOT NULL,
    content TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotes_message_id ON quotes(message_id);
CREATE INDEX IF NOT EXISTS idx_quotes_language ON quotes(language);
CREATE INDEX IF NOT EXISTS idx_meanings_message_id ON meanings(message_id);
CREATE INDEX IF NOT EXISTS idx_contributions_user_id ON contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_contributions_status ON contributions(status);
