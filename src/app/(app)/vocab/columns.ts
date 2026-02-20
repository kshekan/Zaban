import type { LanguageConfig } from "@/lib/language/types";

export interface VocabColumnDef {
  id: string;
  label: string;
  alwaysVisible?: boolean;
}

export interface VocabColumnsConfig {
  order: string[];
  hidden: string[];
}

export const ALL_VOCAB_COLUMNS: VocabColumnDef[] = [
  { id: "english", label: "English", alwaysVisible: true },
  { id: "target", label: "Target", alwaysVisible: true },
  { id: "transliteration", label: "Transliteration" },
  { id: "partOfSpeech", label: "Part of Speech" },
  { id: "plural1", label: "Plural 1" },
  { id: "plural2", label: "Plural 2" },
  { id: "muradif", label: "Synonyms" },
  { id: "mudaad", label: "Antonyms" },
];

export const DEFAULT_ORDER = ALL_VOCAB_COLUMNS.map((c) => c.id);

export function getDefaultConfig(): VocabColumnsConfig {
  return { order: DEFAULT_ORDER, hidden: [] };
}

export function parseColumnsConfig(raw: string | undefined): VocabColumnsConfig {
  if (!raw) return getDefaultConfig();
  try {
    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed.order) &&
      parsed.order.length > 0 &&
      Array.isArray(parsed.hidden)
    ) {
      // Ensure all known columns are present in order (in case new columns were added)
      const known = new Set(DEFAULT_ORDER);
      const orderSet = new Set(parsed.order as string[]);
      const order = (parsed.order as string[]).filter((id: string) => known.has(id));
      for (const id of DEFAULT_ORDER) {
        if (!orderSet.has(id)) order.push(id);
      }
      return { order, hidden: (parsed.hidden as string[]).filter((id: string) => known.has(id)) };
    }
  } catch {
    // fall through
  }
  return getDefaultConfig();
}

export function getVisibleColumns(
  config: VocabColumnsConfig,
  langConfig?: LanguageConfig
): { id: string; label: string }[] {
  const hiddenSet = new Set(config.hidden);
  const colMap = new Map(ALL_VOCAB_COLUMNS.map((c) => [c.id, c]));
  const langLabels = langConfig?.vocabColumns;

  return config.order
    .filter((id) => {
      const def = colMap.get(id);
      if (!def) return false;
      if (def.alwaysVisible) return true;
      return !hiddenSet.has(id);
    })
    .map((id) => {
      const def = colMap.get(id)!;
      let label = def.label;
      if (langLabels && id in langLabels) {
        label = langLabels[id as keyof typeof langLabels];
      }
      return { id, label };
    });
}
