"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TargetText } from "@/components/target-text";
import { arabicConfig } from "@/lib/language/arabic";

interface Conjugation {
  id: number;
  tense: string;
  person: string;
  conjugated: string;
  voweled: string | null;
  transliteration: string | null;
}

interface ConjugationTableProps {
  conjugations: Conjugation[];
}

export function ConjugationTable({ conjugations }: ConjugationTableProps) {
  const tenses = arabicConfig.tenses;
  const persons = arabicConfig.persons;

  // Group conjugations by tense
  const byTense: Record<string, Record<string, Conjugation>> = {};
  for (const conj of conjugations) {
    if (!byTense[conj.tense]) byTense[conj.tense] = {};
    byTense[conj.tense][conj.person] = conj;
  }

  return (
    <Tabs defaultValue={tenses[0]?.id}>
      <TabsList className="flex flex-wrap h-auto gap-1">
        {tenses.map((tense) => (
          <TabsTrigger key={tense.id} value={tense.id}>
            {tense.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tenses.map((tense) => (
        <TabsContent key={tense.id} value={tense.id}>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Person</TableHead>
                  <TableHead>Conjugation</TableHead>
                  <TableHead>With Tashkeel</TableHead>
                  <TableHead>Transliteration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {persons.map((person) => {
                  const conj = byTense[tense.id]?.[person.id];
                  if (!conj && tense.id === "imperative") {
                    // Imperative only has 2nd person forms
                    if (!person.id.startsWith("2")) return null;
                  }
                  if (!conj) {
                    return (
                      <TableRow key={person.id}>
                        <TableCell className="text-muted-foreground">
                          {person.label}
                        </TableCell>
                        <TableCell
                          colSpan={3}
                          className="text-muted-foreground"
                        >
                          —
                        </TableCell>
                      </TableRow>
                    );
                  }
                  return (
                    <TableRow key={person.id}>
                      <TableCell className="font-medium">
                        {person.label}
                      </TableCell>
                      <TableCell>
                        <TargetText className="text-lg">
                          {conj.conjugated}
                        </TargetText>
                      </TableCell>
                      <TableCell>
                        {conj.voweled && (
                          <TargetText className="text-lg">
                            {conj.voweled}
                          </TargetText>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {conj.transliteration}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
