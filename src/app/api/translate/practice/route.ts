import { NextRequest, NextResponse } from "next/server";
import { createAIProvider } from "@/lib/ai/factory";
import { buildPracticeScoringPrompt } from "@/lib/ai/prompts/translation";
import { getLanguageConfig } from "@/lib/language/config";
import { seedDefaults } from "@/lib/db/seed";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  seedDefaults();

  const body = await request.json();
  const { english, attempt, languageCode, addresseeGender: genderOverride } = body;

  if (!english || !attempt) {
    return NextResponse.json(
      { error: "English text and attempt are required" },
      { status: 400 }
    );
  }

  try {
    const langConfig = getLanguageConfig(languageCode || "ar");
    const ai = createAIProvider();

    const gender = genderOverride
      || db.select().from(schema.settings).where(eq(schema.settings.key, "addresseeGender")).get()?.value
      || "masculine";

    const { system, user } = buildPracticeScoringPrompt(
      english,
      attempt,
      langConfig,
      gender
    );

    const response = await ai.complete(user, system);

    let jsonStr = response.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/```json?\n?/g, "").replace(/```$/g, "").trim();
    }

    const parsed = JSON.parse(jsonStr);
    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json(
      {
        error: `Scoring failed: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 }
    );
  }
}
