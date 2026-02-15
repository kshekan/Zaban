import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, inArray } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { ids } = body;

  if (!Array.isArray(ids) || ids.length < 2) {
    return NextResponse.json(
      { error: "At least 2 translation IDs are required" },
      { status: 400 }
    );
  }

  const items = db
    .select()
    .from(schema.translations)
    .where(inArray(schema.translations.id, ids))
    .all();

  if (items.length < 2) {
    return NextResponse.json(
      { error: "Could not find enough translations to merge" },
      { status: 404 }
    );
  }

  // Sort by the order the IDs were provided (preserves user's selection order)
  const idOrder = new Map(ids.map((id: number, i: number) => [id, i]));
  items.sort((a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0));

  // Merge fields
  const sourceText = items.map((i) => i.sourceText).join(" ");
  const translation = items.map((i) => i.translation).join(" ");
  const transliteration = items.some((i) => i.transliteration)
    ? items.map((i) => i.transliteration || "").join(" ").trim()
    : null;

  // Concatenate breakdowns
  const breakdowns = items.flatMap((i) => {
    if (!i.breakdown) return [];
    try {
      const parsed = JSON.parse(i.breakdown);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const notes = items
    .map((i) => i.notes)
    .filter(Boolean)
    .join("\n") || null;

  const merged = db
    .insert(schema.translations)
    .values({
      languageCode: items[0].languageCode,
      type: "reference",
      sourceText,
      translation,
      transliteration,
      notes,
      breakdown: breakdowns.length > 0 ? JSON.stringify(breakdowns) : null,
    })
    .returning()
    .get();

  // Delete originals
  db.delete(schema.translations)
    .where(inArray(schema.translations.id, ids))
    .run();

  return NextResponse.json(merged, { status: 201 });
}
