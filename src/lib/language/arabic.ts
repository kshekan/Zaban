import { LanguageConfig } from "./types";

export const arabicConfig: LanguageConfig = {
  code: "ar",
  name: "Arabic (MSA)",
  direction: "rtl",
  fontFamily: "'Amiri', 'Noto Sans Arabic', serif",
  tenses: [
    { id: "past", label: "Past (الماضي)", labelNative: "الماضي" },
    { id: "present", label: "Present (المضارع)", labelNative: "المضارع" },
    { id: "imperative", label: "Imperative (الأمر)", labelNative: "الأمر" },
    {
      id: "subjunctive",
      label: "Subjunctive (المنصوب)",
      labelNative: "المنصوب",
    },
    { id: "jussive", label: "Jussive (المجزوم)", labelNative: "المجزوم" },
  ],
  persons: [
    { id: "1s", label: "I (أنا)", labelNative: "أنا" },
    { id: "2sm", label: "You (m.s.) (أنتَ)", labelNative: "أنتَ" },
    { id: "2sf", label: "You (f.s.) (أنتِ)", labelNative: "أنتِ" },
    { id: "3sm", label: "He (هو)", labelNative: "هو" },
    { id: "3sf", label: "She (هي)", labelNative: "هي" },
    { id: "2d", label: "You (dual) (أنتما)", labelNative: "أنتما" },
    { id: "3dm", label: "They (m. dual) (هما)", labelNative: "هما (م)" },
    { id: "3df", label: "They (f. dual) (هما)", labelNative: "هما (ف)" },
    { id: "1p", label: "We (نحن)", labelNative: "نحن" },
    { id: "2pm", label: "You (m.pl.) (أنتم)", labelNative: "أنتم" },
    { id: "2pf", label: "You (f.pl.) (أنتنّ)", labelNative: "أنتنّ" },
    { id: "3pm", label: "They (m.pl.) (هم)", labelNative: "هم" },
    { id: "3pf", label: "They (f.pl.) (هنّ)", labelNative: "هنّ" },
  ],
  grammarNotes:
    "Arabic verbs are classified by form (I-X). Form I is the base form. Root letters are typically 3 consonants (trilateral).",
};
