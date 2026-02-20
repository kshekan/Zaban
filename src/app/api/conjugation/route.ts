import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, desc, and } from "drizzle-orm";
import { createAIProvider } from "@/lib/ai/factory";
import { buildConjugationPrompt } from "@/lib/ai/prompts/conjugation";
import { getLanguageConfig } from "@/lib/language/config";
import { seedDefaults } from "@/lib/db/seed";
import { createConjugationFlashcards } from "@/lib/flashcards/create";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  seedDefaults();

  const userId = await getAuthenticatedUserId();
  if (userId instanceof NextResponse) return userId;

  const lang = request.nextUrl.searchParams.get("lang") || "ar";

  const verbList = db
    .select()
    .from(schema.verbs)
    .where(and(eq(schema.verbs.userId, userId), eq(schema.verbs.languageCode, lang)))
    .orderBy(desc(schema.verbs.createdAt))
    .all();

  return NextResponse.json(verbList);
}

export async function POST(request: NextRequest) {
  seedDefaults();

  const userId = await getAuthenticatedUserId();
  if (userId instanceof NextResponse) return userId;

  const body = await request.json();
  const { infinitive, root, form, languageCode } = body;
  const lang = languageCode || "ar";

  if (!infinitive) {
    return NextResponse.json(
      { error: "Infinitive is required" },
      { status: 400 }
    );
  }

  // Create verb entry
  const verb = db
    .insert(schema.verbs)
    .values({
      userId,
      languageCode: lang,
      infinitive,
      root: root || null,
      form: form || null,
      aiGenerated: true,
    })
    .returning()
    .get();

  try {
    const langConfig = getLanguageConfig(lang);
    const ai = createAIProvider(userId);
    const { system, user } = buildConjugationPrompt(
      infinitive,
      root,
      form,
      langConfig
    );

    const response = await ai.complete(user, system);

    // Parse JSON from response (handle possible markdown wrapping)
    let jsonStr = response.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/```json?\n?/g, "").replace(/```$/g, "").trim();
    }

    const parsed = JSON.parse(jsonStr) as {
      metadata?: {
        infinitive?: string;
        root?: string;
        meaning?: string;
        masdar?: string;
        masdarVoweled?: string;
        verbType?: string;
      };
      conjugations: {
        tense: string;
        person: string;
        conjugated: string;
        voweled?: string;
        transliteration?: string;
      }[];
    };

    // Update verb with AI model info and metadata
    // If the user typed in English (no target script), replace infinitive with the Arabic form
    const hasTargetScript = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(infinitive);
    const aiInfinitive = parsed.metadata?.infinitive;

    db.update(schema.verbs)
      .set({
        aiModel: ai.name,
        ...(!hasTargetScript && aiInfinitive ? { infinitive: aiInfinitive } : {}),
        root: parsed.metadata?.root || verb.root,
        meaning: parsed.metadata?.meaning || null,
        masdar: parsed.metadata?.masdar || null,
        masdarVoweled: parsed.metadata?.masdarVoweled || null,
        verbType: parsed.metadata?.verbType || null,
      })
      .where(eq(schema.verbs.id, verb.id))
      .run();

    // Insert conjugation rows
    for (const conj of parsed.conjugations) {
      db.insert(schema.conjugations)
        .values({
          verbId: verb.id,
          tense: conj.tense,
          person: conj.person,
          conjugated: conj.conjugated,
          voweled: conj.voweled || null,
          transliteration: conj.transliteration || null,
        })
        .run();
    }

    // Auto-create flashcards for conjugations
    createConjugationFlashcards(verb.id, userId);

    // Re-fetch updated verb and conjugations
    const updatedVerb = db
      .select()
      .from(schema.verbs)
      .where(eq(schema.verbs.id, verb.id))
      .get();

    const conjugations = db
      .select()
      .from(schema.conjugations)
      .where(eq(schema.conjugations.verbId, verb.id))
      .all();

    return NextResponse.json(
      { verb: updatedVerb, conjugations },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: `AI generation failed: ${error instanceof Error ? error.message : String(error)}`,
        verb,
      },
      { status: 500 }
    );
  }
}
