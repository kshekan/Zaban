import Database from "better-sqlite3";
import { randomUUID } from "crypto";

const dbPath = process.env.DB_PATH || "./zaban.db";
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ─── Auth tables ────────────────────────────────────────────────────

db.exec(`
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
`);

// ─── App data tables (fresh install) ────────────────────────────────

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

// ─── Migrate existing data to a user account ────────────────────────
// If old tables exist without user_id, we need to migrate them.

function tableHasColumn(table, column) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  return cols.some((c) => c.name === column);
}

function addColumnIfMissing(table, column, type) {
  if (!tableHasColumn(table, column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
    console.log(`Added column ${table}.${column}`);
  }
}

const needsMigration = !tableHasColumn("vocab", "user_id");

if (needsMigration) {
  console.log("Migrating existing data to multi-user schema...");

  // Create a migration user to own all existing data.
  // Password: "changeme123" — the user should change this after first login.
  // bcryptjs hash of "changeme123" with 12 rounds (pre-computed to avoid needing bcryptjs here)
  const migrationUserId = randomUUID();
  const migrationEmail = "admin@zaban.local";
  // Hash generated with: bcryptjs.hashSync("changeme123", 12)
  const migrationPasswordHash = "$2b$12$52vxv1EWvyZYXLxFVZ16hermhDpo1JlLmqjmXni7yC5AdEO8F/Txm";

  const existingUser = db.prepare("SELECT id FROM users WHERE email = ?").get(migrationEmail);

  let userId;
  if (existingUser) {
    userId = existingUser.id;
    console.log("Migration user already exists, using existing account.");
  } else {
    db.prepare(
      "INSERT INTO users (id, name, email, password, created_at) VALUES (?, ?, ?, ?, datetime('now'))"
    ).run(migrationUserId, "Admin", migrationEmail, migrationPasswordHash);
    userId = migrationUserId;
    console.log(`Created migration user: ${migrationEmail}`);
  }

  // Add user_id to tables that need it and backfill
  const dataTables = ["vocab", "verbs", "flashcards", "translations"];
  for (const table of dataTables) {
    if (!tableHasColumn(table, "user_id")) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN user_id TEXT`);
      db.prepare(`UPDATE ${table} SET user_id = ?`).run(userId);
      console.log(`Migrated ${table}: added user_id and assigned to migration user`);
    }
  }

  // Migrate settings from old schema (key TEXT PRIMARY KEY) to new (user_id + key composite)
  // Check if settings has the old schema
  const settingsCols = db.prepare("PRAGMA table_info(settings)").all();
  const hasUserId = settingsCols.some((c) => c.name === "user_id");

  if (!hasUserId) {
    // Read existing settings
    const oldSettings = db.prepare("SELECT key, value FROM settings").all();

    // Drop old table and recreate with new schema
    db.exec("DROP TABLE settings");
    db.exec(`
      CREATE TABLE settings (
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (user_id, key)
      )
    `);

    // Re-insert old settings under migration user
    const insertSetting = db.prepare(
      "INSERT OR IGNORE INTO settings (user_id, key, value) VALUES (?, ?, ?)"
    );
    for (const s of oldSettings) {
      insertSetting.run(userId, s.key, s.value);
    }
    console.log(`Migrated ${oldSettings.length} settings to migration user`);
  }

  // Add missing columns on older databases
  addColumnIfMissing("vocab", "plural1", "TEXT");
  addColumnIfMissing("vocab", "plural2", "TEXT");
  addColumnIfMissing("vocab", "muradif", "TEXT");
  addColumnIfMissing("vocab", "mudaad", "TEXT");
  addColumnIfMissing("translations", "breakdown", "TEXT");

  console.log("Migration complete!");
  console.log(`\n  Log in with: ${migrationEmail} / changeme123\n`);
}

// ─── Seed default languages ─────────────────────────────────────────

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
