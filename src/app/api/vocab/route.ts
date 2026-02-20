import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, desc, like, or, and } from "drizzle-orm";
import { seedDefaults } from "@/lib/db/seed";
import { createVocabFlashcard } from "@/lib/flashcards/create";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  seedDefaults();

  const userId = await getAuthenticatedUserId();
  if (userId instanceof NextResponse) return userId;

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search");
  const lang = searchParams.get("lang") || "ar";

  const langFilter = and(
    eq(schema.vocab.userId, userId),
    eq(schema.vocab.languageCode, lang)
  );

  const condition = search
    ? and(
        langFilter,
        or(
          like(schema.vocab.english, `%${search}%`),
          like(schema.vocab.target, `%${search}%`),
          like(schema.vocab.transliteration, `%${search}%`)
        )
      )
    : langFilter;

  const results = db
    .select()
    .from(schema.vocab)
    .where(condition)
    .orderBy(desc(schema.vocab.createdAt))
    .all();

  return NextResponse.json(results);
}

export async function POST(request: NextRequest) {
  seedDefaults();

  const userId = await getAuthenticatedUserId();
  if (userId instanceof NextResponse) return userId;

  const body = await request.json();
  const { words, english, target, transliteration, partOfSpeech, tags, notes, languageCode } = body;

  // Batch add: { words: string[], languageCode }
  if (words && Array.isArray(words)) {
    const lang = languageCode || "ar";
    const results = [];

    for (const word of words) {
      const trimmed = word.trim();
      if (!trimmed) continue;

      const result = db
        .insert(schema.vocab)
        .values({
          userId,
          languageCode: lang,
          english: trimmed,
          target: "",
        })
        .returning()
        .get();

      results.push(result);
    }

    return NextResponse.json(results, { status: 201 });
  }

  // Single add (legacy): { english, target, ... }
  if (!english || !target) {
    return NextResponse.json(
      { error: "English and target fields are required" },
      { status: 400 }
    );
  }

  const result = db
    .insert(schema.vocab)
    .values({
      userId,
      languageCode: languageCode || "ar",
      english,
      target,
      transliteration: transliteration || null,
      partOfSpeech: partOfSpeech || null,
      tags: tags || null,
      notes: notes || null,
    })
    .returning()
    .get();

  // Auto-create flashcard (guard in create.ts skips empty targets)
  createVocabFlashcard(result.id, userId);

  return NextResponse.json(result, { status: 201 });
}
