import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const languages = sqliteTable("languages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  direction: text("direction", { enum: ["ltr", "rtl"] })
    .notNull()
    .default("ltr"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const vocab = sqliteTable("vocab", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  languageCode: text("language_code").notNull(),
  english: text("english").notNull(),
  target: text("target").notNull(),
  transliteration: text("transliteration"),
  partOfSpeech: text("part_of_speech"),
  tags: text("tags"),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const verbs = sqliteTable("verbs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  languageCode: text("language_code").notNull(),
  vocabId: integer("vocab_id").references(() => vocab.id, {
    onDelete: "set null",
  }),
  infinitive: text("infinitive").notNull(),
  root: text("root"),
  form: text("form"),
  aiGenerated: integer("ai_generated", { mode: "boolean" })
    .notNull()
    .default(false),
  aiModel: text("ai_model"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const conjugations = sqliteTable("conjugations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  verbId: integer("verb_id")
    .notNull()
    .references(() => verbs.id, { onDelete: "cascade" }),
  tense: text("tense").notNull(),
  person: text("person").notNull(),
  conjugated: text("conjugated").notNull(),
  voweled: text("voweled"),
  transliteration: text("transliteration"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const flashcards = sqliteTable("flashcards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  languageCode: text("language_code").notNull(),
  vocabId: integer("vocab_id").references(() => vocab.id, {
    onDelete: "cascade",
  }),
  conjugationId: integer("conjugation_id").references(() => conjugations.id, {
    onDelete: "cascade",
  }),
  front: text("front").notNull(),
  back: text("back").notNull(),
  cardType: text("card_type", {
    enum: ["vocab", "conjugation"],
  }).notNull(),
  easeFactor: real("ease_factor").notNull().default(2.5),
  interval: integer("interval").notNull().default(0),
  repetitions: integer("repetitions").notNull().default(0),
  nextReview: text("next_review")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const reviewHistory = sqliteTable("review_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  flashcardId: integer("flashcard_id")
    .notNull()
    .references(() => flashcards.id, { onDelete: "cascade" }),
  quality: integer("quality").notNull(),
  easeFactor: real("ease_factor").notNull(),
  interval: integer("interval").notNull(),
  reviewedAt: text("reviewed_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
