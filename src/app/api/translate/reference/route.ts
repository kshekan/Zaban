import { NextRequest, NextResponse } from "next/server";
import { createAIProvider } from "@/lib/ai/factory";
import { buildReferenceTranslationPrompt } from "@/lib/ai/prompts/translation";
import { getLanguageConfig } from "@/lib/language/config";
import { seedDefaults } from "@/lib/db/seed";

export async function POST(request: NextRequest) {
  seedDefaults();

  const body = await request.json();
  const { text, languageCode } = body;

  if (!text) {
    return NextResponse.json(
      { error: "Text is required" },
      { status: 400 }
    );
  }

  try {
    const langConfig = getLanguageConfig(languageCode || "ar");
    const ai = createAIProvider();
    const { system, user } = buildReferenceTranslationPrompt(text, langConfig);

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
        error: `Translation failed: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 }
    );
  }
}
