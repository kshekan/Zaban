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

  const farsiExists = db
    .select()
    .from(schema.languages)
    .where(eq(schema.languages.code, "fa"))
    .get();

  if (!farsiExists) {
    db.insert(schema.languages)
      .values({
        code: "fa",
        name: "Farsi (Persian)",
        direction: "rtl",
      })
      .run();
  }
}
