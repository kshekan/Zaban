import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { createVocabFlashcard } from "@/lib/flashcards/create";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (userId instanceof NextResponse) return userId;

  const body = await request.json();
  const { rows, languageCode } = body as {
    rows: {
      english: string;
      target?: string;
      transliteration?: string;
      partOfSpeech?: string;
      tags?: string;
      notes?: string;
      plural1?: string;
      plural2?: string;
      muradif?: string;
      mudaad?: string;
    }[];
    languageCode?: string;
  };

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json(
      { error: "No rows provided" },
      { status: 400 }
    );
  }

  const lang = languageCode || "ar";
  let imported = 0;
  const errors: { row: number; error: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row.english) {
      errors.push({ row: i + 1, error: "Missing english" });
      continue;
    }

    try {
      const result = db.insert(schema.vocab)
        .values({
          userId,
          languageCode: lang,
          english: row.english.trim(),
          target: row.target?.trim() || "",
          transliteration: row.transliteration?.trim() || null,
          partOfSpeech: row.partOfSpeech?.trim() || null,
          tags: row.tags?.trim() || null,
          notes: row.notes?.trim() || null,
          plural1: row.plural1?.trim() || null,
          plural2: row.plural2?.trim() || null,
          muradif: row.muradif?.trim() || null,
          mudaad: row.mudaad?.trim() || null,
        })
        .returning()
        .get();
      // Guard in createVocabFlashcard skips empty targets
      createVocabFlashcard(result.id, userId);
      imported++;
    } catch (e) {
      errors.push({ row: i + 1, error: String(e) });
    }
  }

  return NextResponse.json({ imported, errors, total: rows.length });
}
