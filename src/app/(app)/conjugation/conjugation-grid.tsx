"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TargetText } from "@/components/target-text";
import { useLanguage } from "@/components/language-provider";
import { getLanguageConfig } from "@/lib/language/config";

interface Conjugation {
  id: number;
  tense: string;
  person: string;
  conjugated: string;
  voweled: string | null;
  transliteration: string | null;
}

export function ConjugationGrid({
  conjugations,
}: {
  conjugations: Conjugation[];
}) {
  const { activeLanguage } = useLanguage();
  const langConfig = getLanguageConfig(activeLanguage);

  const lookup: Record<string, Record<string, Conjugation>> = {};
  for (const c of conjugations) {
    if (!lookup[c.tense]) lookup[c.tense] = {};
    lookup[c.tense][c.person] = c;
  }

  const activeTenses = langConfig.tenses.filter((t) => lookup[t.id]);
  const persons = langConfig.persons;

  return (
    <div className="rounded-lg border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px] sm:w-[100px] sticky left-0 z-10 bg-muted">
              <span className="text-[11px] font-medium uppercase tracking-wider">
                Pronoun
              </span>
            </TableHead>
            {activeTenses.map((t) => (
              <TableHead key={t.id} className="text-center min-w-[100px]">
                <div className="leading-tight">
                  <span className="text-[11px] font-medium uppercase tracking-wider">
                    {t.label.split("(")[0].trim()}
                  </span>
                  {t.labelNative && (
                    <p
                      className="text-xs text-muted-foreground font-target"
                      dir="rtl"
                    >
                      {t.labelNative}
                    </p>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {persons.map((person) => {
            const hasData = activeTenses.some(
              (t) => t.id !== "imperative" && lookup[t.id]?.[person.id]
            );
            const hasImperative = lookup["imperative"]?.[person.id];
            if (!hasData && !hasImperative) return null;

            return (
              <TableRow key={person.id}>
                <TableCell className="sticky left-0 z-10 bg-card border-r py-2">
                  <p className="text-xs font-medium leading-tight">
                    {person.label.split("(")[0].trim()}
                  </p>
                  {person.labelNative && (
                    <p
                      className="text-xs text-muted-foreground font-target"
                      dir="rtl"
                    >
                      {person.labelNative}
                    </p>
                  )}
                </TableCell>
                {activeTenses.map((t) => {
                  const conj = lookup[t.id]?.[person.id];
                  return (
                    <TableCell key={t.id} className="text-center py-2">
                      {conj ? (
                        <TargetText className="text-base sm:text-xl font-semibold">
                          {conj.voweled || conj.conjugated}
                        </TargetText>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
