import Database from "better-sqlite3";

const dbPath = process.env.DB_PATH || "./zaban.db";
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS languages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    direction TEXT NOT NULL DEFAULT 'ltr',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS vocab (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    language_code TEXT NOT NULL,
    english TEXT NOT NULL,
    target TEXT NOT NULL,
    transliteration TEXT,
    part_of_speech TEXT,
    tags TEXT,
    notes TEXT,
    plural1 TEXT,
    plural2 TEXT,
    muradif TEXT,
    mudaad TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS verbs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    language_code TEXT NOT NULL,
    vocab_id INTEGER REFERENCES vocab(id) ON DELETE SET NULL,
    infinitive TEXT NOT NULL,
    root TEXT,
    form TEXT,
    meaning TEXT,
    masdar TEXT,
    masdar_voweled TEXT,
    verb_type TEXT,
    ai_generated INTEGER NOT NULL DEFAULT 0,
    ai_model TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS conjugations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    verb_id INTEGER NOT NULL REFERENCES verbs(id) ON DELETE CASCADE,
    tense TEXT NOT NULL,
    person TEXT NOT NULL,
    conjugated TEXT NOT NULL,
    voweled TEXT,
    transliteration TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS flashcards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    language_code TEXT NOT NULL,
    vocab_id INTEGER REFERENCES vocab(id) ON DELETE CASCADE,
    conjugation_id INTEGER REFERENCES conjugations(id) ON DELETE CASCADE,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    card_type TEXT NOT NULL,
    ease_factor REAL NOT NULL DEFAULT 2.5,
    interval INTEGER NOT NULL DEFAULT 0,
    repetitions INTEGER NOT NULL DEFAULT 0,
    next_review TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS review_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    flashcard_id INTEGER NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
    quality INTEGER NOT NULL,
    ease_factor REAL NOT NULL,
    interval INTEGER NOT NULL,
    reviewed_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS translations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    language_code TEXT NOT NULL,
    type TEXT NOT NULL,
    source_text TEXT NOT NULL,
    translation TEXT NOT NULL,
    transliteration TEXT,
    notes TEXT,
    attempt TEXT,
    score INTEGER,
    is_correct INTEGER,
    mistakes TEXT,
    feedback TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Seed defaults
const hasArabic = db.prepare("SELECT 1 FROM languages WHERE code = 'ar'").get();
if (!hasArabic) {
  db.prepare("INSERT INTO languages (code, name, direction) VALUES ('ar', 'Arabic (MSA)', 'rtl')").run();
}

const hasFarsi = db.prepare("SELECT 1 FROM languages WHERE code = 'fa'").get();
if (!hasFarsi) {
  db.prepare("INSERT INTO languages (code, name, direction) VALUES ('fa', 'Farsi (Persian)', 'rtl')").run();
}

const hasActiveLang = db.prepare("SELECT 1 FROM settings WHERE key = 'activeLanguage'").get();
if (!hasActiveLang) {
  const insert = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
  insert.run("activeLanguage", "ar");
  insert.run("aiProvider", "anthropic");
  insert.run("aiModel", "claude-sonnet-4-5-20250929");
}

db.close();
console.log("Database initialized at", dbPath);
