import { LanguageConfig } from "@/lib/language/types";

export function buildConjugationPrompt(
  verb: string,
  root: string | null,
  form: string | null,
  langConfig: LanguageConfig
): { system: string; user: string } {
  const tenseList = langConfig.tenses.map((t) => t.id).join(", ");
  const personList = langConfig.persons.map((p) => p.id).join(", ");

  const system = `You are a ${langConfig.name} language expert. You generate accurate verb conjugation tables. Always respond with valid JSON only, no extra text.`;

  const user = `Generate the full conjugation table for the ${langConfig.name} verb "${verb}"${root ? ` (root: ${root})` : ""}${form ? ` (form: ${form})` : ""}.

Return a JSON object with this exact structure:
{
  "conjugations": [
    {
      "tense": "<tense_id>",
      "person": "<person_id>",
      "conjugated": "<conjugated form>",
      "voweled": "<with diacritics/tashkeel if applicable>",
      "transliteration": "<romanized>"
    }
  ]
}

Tenses: ${tenseList}
Persons: ${personList}

Generate one entry for every tense+person combination. Note: for imperative tense, only 2nd person forms exist — skip 1st and 3rd person for imperative.

Return ONLY the JSON object, no markdown, no explanation.`;

  return { system, user };
}
