"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TargetText } from "@/components/target-text";
import { Search, Trash2, RefreshCw, Languages, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/language-provider";
import { getLanguageConfig } from "@/lib/language/config";
import { parseColumnsConfig, getVisibleColumns } from "./columns";

interface VocabItem {
  id: number;
  languageCode: string;
  english: string;
  target: string;
  transliteration: string | null;
  partOfSpeech: string | null;
  tags: string | null;
  notes: string | null;
  plural1: string | null;
  plural2: string | null;
  muradif: string | null;
  mudaad: string | null;
  createdAt: string;
}

export default function VocabPage() {
  const { activeLanguage } = useLanguage();
  const langConfig = getLanguageConfig(activeLanguage);
  const [items, setItems] = useState<VocabItem[]>([]);
  const [search, setSearch] = useState("");
  const [newWords, setNewWords] = useState("");
  const [adding, setAdding] = useState(false);
  const [translatingAll, setTranslatingAll] = useState(false);
  const [translatingIds, setTranslatingIds] = useState<Set<number>>(new Set());
  const [visibleCols, setVisibleCols] = useState<{ id: string; label: string }[]>([]);

  const fetchVocab = useCallback(async () => {
    const params = new URLSearchParams();
    params.set("lang", activeLanguage);
    if (search) params.set("search", search);
    const res = await fetch(`/api/vocab?${params}`);
    const data = await res.json();
    setItems(data);
  }, [search, activeLanguage]);

  useEffect(() => {
    fetchVocab();
  }, [fetchVocab]);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        const config = parseColumnsConfig(data.vocabColumns);
        setVisibleCols(getVisibleColumns(config, langConfig));
      });
  }, [langConfig]);

  const untranslatedCount = items.filter((i) => !i.target).length;

  const renderCell = (colId: string, item: VocabItem) => {
    switch (colId) {
      case "english":
        return <span className="font-medium">{item.english}</span>;
      case "target":
        return item.target ? (
          <TargetText className="text-2xl">{item.target}</TargetText>
        ) : (
          <span className="italic text-muted-foreground">Untranslated</span>
        );
      case "transliteration":
        return <span className="text-muted-foreground">{item.transliteration}</span>;
      case "partOfSpeech":
        return item.partOfSpeech ? (
          <Badge variant="secondary">{item.partOfSpeech}</Badge>
        ) : null;
      case "plural1":
        return item.plural1 ? <TargetText>{item.plural1}</TargetText> : null;
      case "plural2":
        return item.plural2 ? <TargetText>{item.plural2}</TargetText> : null;
      case "muradif":
        return item.muradif ? (
          <span className="text-green-700 dark:text-green-400">
            <TargetText>{item.muradif}</TargetText>
          </span>
        ) : null;
      case "mudaad":
        return item.mudaad ? (
          <span className="text-red-700 dark:text-red-400">
            <TargetText>{item.mudaad}</TargetText>
          </span>
        ) : null;
      default:
        return null;
    }
  };

  const handleAdd = async () => {
    const words = newWords
      .split(",")
      .map((w) => w.trim())
      .filter(Boolean);

    if (words.length === 0) return;

    setAdding(true);
    try {
      const res = await fetch("/api/vocab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words, languageCode: activeLanguage }),
      });
      if (res.ok) {
        toast.success(`Added ${words.length} word${words.length > 1 ? "s" : ""}`);
        setNewWords("");
        fetchVocab();
      } else {
        toast.error("Failed to add words");
      }
    } catch {
      toast.error("Failed to add words");
    } finally {
      setAdding(false);
    }
  };

  const handleTranslateAll = async () => {
    setTranslatingAll(true);
    try {
      const res = await fetch("/api/vocab/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ languageCode: activeLanguage }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Translated ${data.translated} word${data.translated !== 1 ? "s" : ""}`);
        fetchVocab();
      } else {
        toast.error(data.error || "Translation failed");
      }
    } catch {
      toast.error("Translation failed");
    } finally {
      setTranslatingAll(false);
    }
  };

  const handleTranslateOne = async (id: number) => {
    setTranslatingIds((prev) => new Set(prev).add(id));
    try {
      const res = await fetch("/api/vocab/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id], languageCode: activeLanguage }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Translated");
        fetchVocab();
      } else {
        toast.error(data.error || "Translation failed");
      }
    } catch {
      toast.error("Translation failed");
    } finally {
      setTranslatingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/vocab/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Word deleted");
      fetchVocab();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Vocabulary</h1>
        <div className="flex gap-2">
          {untranslatedCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleTranslateAll}
              disabled={translatingAll}
            >
              {translatingAll ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Languages className="h-4 w-4 mr-1" />
              )}
              Translate All ({untranslatedCount})
            </Button>
          )}
        </div>
      </div>

      {/* Inline add input */}
      <form
        className="flex flex-col sm:flex-row gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          handleAdd();
        }}
      >
        <Input
          placeholder="Type words separated by commas, e.g. hat, cat, car"
          value={newWords}
          onChange={(e) => setNewWords(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={adding || !newWords.trim()}>
          {adding ? "Adding..." : "Add"}
        </Button>
      </form>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search vocabulary..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleCols.map((col) => (
                <TableHead key={col.id}>{col.label}</TableHead>
              ))}
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleCols.length + 1}
                  className="text-center text-muted-foreground py-8"
                >
                  No vocabulary items yet. Add some words to get started.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  {visibleCols.map((col) => (
                    <TableCell key={col.id}>
                      {renderCell(col.id, item)}
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleTranslateOne(item.id)}
                        disabled={translatingIds.has(item.id) || translatingAll}
                        title="Translate"
                      >
                        {translatingIds.has(item.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

    </div>
  );
}
