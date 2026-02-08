import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { createAIProvider } from "@/lib/ai/factory";
import { buildConjugationPrompt } from "@/lib/ai/prompts/conjugation";
import { getLanguageConfig } from "@/lib/language/config";
import { seedDefaults } from "@/lib/db/seed";
import { createConjugationFlashcards } from "@/lib/flashcards/create";

export const dynamic = "force-dynamic";

export async function GET() {
  seedDefaults();

  const verbList = db
    .select()
    .from(schema.verbs)
    .orderBy(desc(schema.verbs.createdAt))
    .all();

  return NextResponse.json(verbList);
}

export async function POST(request: NextRequest) {
  seedDefaults();

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
    const ai = createAIProvider();
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
      conjugations: {
        tense: string;
        person: string;
        conjugated: string;
        voweled?: string;
        transliteration?: string;
      }[];
    };

    // Update verb with AI model info
    db.update(schema.verbs)
      .set({ aiModel: ai.name })
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
    createConjugationFlashcards(verb.id);

    // Return verb with conjugations
    const conjugations = db
      .select()
      .from(schema.conjugations)
      .where(eq(schema.conjugations.verbId, verb.id))
      .all();

    return NextResponse.json({ verb, conjugations }, { status: 201 });
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
