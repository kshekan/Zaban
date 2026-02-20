import { AIProvider } from "./provider";
import { AnthropicProvider } from "./anthropic";
import { DeepSeekProvider } from "./deepseek";
import { GeminiProvider } from "./gemini";
import { db, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";

function getSetting(userId: string, key: string): string | undefined {
  const row = db
    .select()
    .from(schema.settings)
    .where(and(eq(schema.settings.userId, userId), eq(schema.settings.key, key)))
    .get();
  return row?.value;
}

export function createAIProvider(userId: string): AIProvider {
  const provider = getSetting(userId, "aiProvider") || "anthropic";
  const model = getSetting(userId, "aiModel");

  const envKeys: Record<string, string | undefined> = {
    anthropic: process.env.ANTHROPIC_API_KEY,
    deepseek: process.env.DEEPSEEK_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
  };
  const apiKey = getSetting(userId, "aiApiKey") || envKeys[provider] || "";

  switch (provider) {
    case "anthropic":
      return new AnthropicProvider({ apiKey, model });
    case "deepseek":
      return new DeepSeekProvider({ apiKey, model });
    case "gemini":
      return new GeminiProvider({ apiKey, model });
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}
