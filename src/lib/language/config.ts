import { LanguageConfig } from "./types";
import { arabicConfig } from "./arabic";

const registry: Record<string, LanguageConfig> = {
  ar: arabicConfig,
};

export function getLanguageConfig(code: string): LanguageConfig {
  const config = registry[code];
  if (!config) {
    throw new Error(`No language config found for code: ${code}`);
  }
  return config;
}

export function getAvailableLanguages(): { code: string; name: string }[] {
  return Object.entries(registry).map(([code, config]) => ({
    code,
    name: config.name,
  }));
}
