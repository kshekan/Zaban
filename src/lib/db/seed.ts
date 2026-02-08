import { db, schema } from "./index";
import { eq } from "drizzle-orm";

let seeded = false;

export function seedDefaults() {
  if (seeded) return;
  seeded = true;

  const existing = db
    .select()
    .from(schema.languages)
    .where(eq(schema.languages.code, "ar"))
    .get();

  if (!existing) {
    db.insert(schema.languages)
      .values({
        code: "ar",
        name: "Arabic (MSA)",
        direction: "rtl",
      })
      .run();
  }

  const activeLang = db
    .select()
    .from(schema.settings)
    .where(eq(schema.settings.key, "activeLanguage"))
    .get();

  if (!activeLang) {
    db.insert(schema.settings)
      .values([
        { key: "activeLanguage", value: "ar" },
        { key: "aiProvider", value: "anthropic" },
        { key: "aiModel", value: "claude-sonnet-4-5-20250929" },
      ])
      .run();
  }
}
