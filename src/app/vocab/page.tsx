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
import { Plus, Search, Upload, Trash2, Pencil } from "lucide-react";
import { VocabForm } from "./vocab-form";
import { VocabImport } from "./vocab-import";
import { VocabEditDialog } from "./vocab-edit-dialog";
import { toast } from "sonner";

interface VocabItem {
  id: number;
  languageCode: string;
  english: string;
  target: string;
  transliteration: string | null;
  partOfSpeech: string | null;
  tags: string | null;
  notes: string | null;
  createdAt: string;
}

export default function VocabPage() {
  const [items, setItems] = useState<VocabItem[]>([]);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editItem, setEditItem] = useState<VocabItem | null>(null);

  const fetchVocab = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/vocab?${params}`);
    const data = await res.json();
    setItems(data);
  }, [search]);

  useEffect(() => {
    fetchVocab();
  }, [fetchVocab]);

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/vocab/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Word deleted");
      fetchVocab();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Vocabulary</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImport(true)}
          >
            <Upload className="h-4 w-4 mr-1" />
            Import
          </Button>
          <Button size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Word
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search vocabulary..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>English</TableHead>
              <TableHead>Target</TableHead>
              <TableHead className="hidden sm:table-cell">
                Transliteration
              </TableHead>
              <TableHead className="hidden md:table-cell">
                Part of Speech
              </TableHead>
              <TableHead className="hidden lg:table-cell">Tags</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-8"
                >
                  No vocabulary items yet. Add some words to get started.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.english}</TableCell>
                  <TableCell>
                    <TargetText className="text-lg">{item.target}</TargetText>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {item.transliteration}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {item.partOfSpeech && (
                      <Badge variant="secondary">{item.partOfSpeech}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                    {item.tags}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditItem(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id)}
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

      <VocabForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onSuccess={fetchVocab}
      />

      <VocabImport
        open={showImport}
        onOpenChange={setShowImport}
        onSuccess={fetchVocab}
      />

      {editItem && (
        <VocabEditDialog
          item={editItem}
          open={!!editItem}
          onOpenChange={(open) => !open && setEditItem(null)}
          onSuccess={fetchVocab}
        />
      )}
    </div>
  );
}
