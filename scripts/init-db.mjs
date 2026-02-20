import Database from "better-sqlite3";

const dbPath = process.env.DB_PATH || "./zaban.db";
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  -- Auth tables
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT NOT NULL UNIQUE,
    email_verified INTEGER,
    image TEXT,
    password TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS accounts (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_account_id TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    PRIMARY KEY (provider, provider_account_id)
  );

  CREATE TABLE IF NOT EXISTS sessions (
    session_token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS verification_tokens (
    identifier TEXT NOT NULL,
    token TEXT NOT NULL,
    expires INTEGER NOT NULL,
    PRIMARY KEY (identifier, token)
  );

  -- App data tables
  CREATE TABLE IF NOT EXISTS languages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    direction TEXT NOT NULL DEFAULT 'ltr',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS vocab (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL,
    type TEXT NOT NULL,
    source_text TEXT NOT NULL,
    translation TEXT NOT NULL,
    transliteration TEXT,
    notes TEXT,
    breakdown TEXT,
    attempt TEXT,
    score INTEGER,
    is_correct INTEGER,
    mistakes TEXT,
    feedback TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, key)
  );
`);

// Migrate: drop old tables that lack user_id columns
// (the old settings table had a different primary key structure too)
function tableHasColumn(table, column) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  return cols.some((c) => c.name === column);
}

const tablesToMigrate = ["vocab", "verbs", "flashcards", "translations", "settings"];
for (const table of tablesToMigrate) {
  try {
    const info = db.prepare(`PRAGMA table_info(${table})`).all();
    if (info.length > 0 && !tableHasColumn(table, "user_id")) {
      console.log(`Migrating table ${table}: dropping old version without user_id`);
      db.exec(`DROP TABLE IF EXISTS ${table}`);
    }
  } catch (e) {
    // table doesn't exist yet, that's fine
  }
}

// Also drop dependent tables if parent was dropped
if (!tableHasColumn("flashcards", "user_id")) {
  db.exec("DROP TABLE IF EXISTS review_history");
  db.exec("DROP TABLE IF EXISTS flashcards");
}
if (!tableHasColumn("verbs", "user_id")) {
  db.exec("DROP TABLE IF EXISTS conjugations");
  db.exec("DROP TABLE IF EXISTS verbs");
}

// Re-run CREATE TABLE IF NOT EXISTS to rebuild dropped tables
db.exec(`
  CREATE TABLE IF NOT EXISTS vocab (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL,
    type TEXT NOT NULL,
    source_text TEXT NOT NULL,
    translation TEXT NOT NULL,
    transliteration TEXT,
    notes TEXT,
    breakdown TEXT,
    attempt TEXT,
    score INTEGER,
    is_correct INTEGER,
    mistakes TEXT,
    feedback TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, key)
  );
`);

// Seed default languages
const hasArabic = db.prepare("SELECT 1 FROM languages WHERE code = 'ar'").get();
if (!hasArabic) {
  db.prepare("INSERT INTO languages (code, name, direction) VALUES ('ar', 'Arabic (MSA)', 'rtl')").run();
}

const hasFarsi = db.prepare("SELECT 1 FROM languages WHERE code = 'fa'").get();
if (!hasFarsi) {
  db.prepare("INSERT INTO languages (code, name, direction) VALUES ('fa', 'Farsi (Persian)', 'rtl')").run();
}

db.close();
console.log("Database initialized at", dbPath);
