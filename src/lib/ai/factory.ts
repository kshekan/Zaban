import { AIProvider } from "./provider";
import { AnthropicProvider } from "./anthropic";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

function getSetting(key: string): string | undefined {
  const row = db
    .select()
    .from(schema.settings)
    .where(eq(schema.settings.key, key))
    .get();
  return row?.value;
}

export function createAIProvider(): AIProvider {
  const provider = getSetting("aiProvider") || "anthropic";
  const apiKey =
    getSetting("aiApiKey") || process.env.ANTHROPIC_API_KEY || "";
  const model = getSetting("aiModel");

  switch (provider) {
    case "anthropic":
      return new AnthropicProvider({ apiKey, model });
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}
