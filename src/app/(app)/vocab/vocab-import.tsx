"use client";

import { useState } from "react";
import Papa from "papaparse";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface ImportRow {
  english: string;
  target: string;
  transliteration?: string;
  partOfSpeech?: string;
  tags?: string;
  notes?: string;
}

interface VocabImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  languageCode: string;
}

export function VocabImport({ open, onOpenChange, onSuccess, languageCode }: VocabImportProps) {
  const [rawText, setRawText] = useState("");
  const [parsedRows, setParsedRows] = useState<ImportRow[]>([]);
  const [step, setStep] = useState<"input" | "preview">("input");
  const [importing, setImporting] = useState(false);

  const handleParse = () => {
    const result = Papa.parse<Record<string, string>>(rawText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
    });

    const rows: ImportRow[] = result.data
      .map((row) => ({
        english: row.english || row.en || "",
        target: row.target || row.arabic || row.ar || "",
        transliteration: row.transliteration || row.translit || "",
        partOfSpeech: row.partofspeech || row.pos || row.part_of_speech || "",
        tags: row.tags || "",
        notes: row.notes || "",
      }))
      .filter((r) => r.english);

    if (rows.length === 0) {
      toast.error(
        "No valid rows found. Ensure CSV has an 'english' column."
      );
      return;
    }

    setParsedRows(rows);
    setStep("preview");
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await fetch("/api/vocab/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: parsedRows, languageCode }),
      });
      const data = await res.json();
      toast.success(`Imported ${data.imported} of ${data.total} words`);
      if (data.errors?.length > 0) {
        toast.error(`${data.errors.length} rows had errors`);
      }
      setRawText("");
      setParsedRows([]);
      setStep("input");
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Import failed");
    } finally {
      setImporting(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setRawText("");
      setParsedRows([]);
      setStep("input");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Vocabulary</DialogTitle>
        </DialogHeader>

        {step === "input" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                Paste CSV data (columns: english, target, transliteration,
                partOfSpeech, tags, notes)
              </Label>
              <Textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={10}
                placeholder={`english,target,transliteration,partOfSpeech,tags\nbook,كتاب,kitāb,noun,school\npen,قلم,qalam,noun,school`}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label
                htmlFor="csv-file"
                className="cursor-pointer text-sm text-primary underline"
              >
                Or upload a CSV file
              </Label>
              <input
                id="csv-file"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      setRawText(ev.target?.result as string);
                    };
                    reader.readAsText(file);
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button onClick={handleParse} disabled={!rawText.trim()}>
                Preview
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Found {parsedRows.length} words to import:
            </p>
            <div className="max-h-60 overflow-y-auto overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>English</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Transliteration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.slice(0, 50).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row.english}</TableCell>
                      <TableCell dir="rtl">{row.target}</TableCell>
                      <TableCell>{row.transliteration}</TableCell>
                    </TableRow>
                  ))}
                  {parsedRows.length > 50 && (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-muted-foreground"
                      >
                        ...and {parsedRows.length - 50} more
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep("input")}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={importing}>
                {importing ? "Importing..." : `Import ${parsedRows.length} Words`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
