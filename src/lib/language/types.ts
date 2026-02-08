export interface LanguageConfig {
  code: string;
  name: string;
  direction: "ltr" | "rtl";
  fontFamily?: string;
  tenses: TenseConfig[];
  persons: PersonConfig[];
  grammarNotes?: string;
}

export interface TenseConfig {
  id: string;
  label: string;
  labelNative?: string;
}

export interface PersonConfig {
  id: string;
  label: string;
  labelNative?: string;
}
