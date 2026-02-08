"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConjugationTable } from "./conjugation-table";

interface Verb {
  id: number;
  infinitive: string;
  root: string | null;
  form: string | null;
  aiGenerated: boolean;
  createdAt: string;
}

interface Conjugation {
  id: number;
  verbId: number;
  tense: string;
  person: string;
  conjugated: string;
  voweled: string | null;
  transliteration: string | null;
}

const arabicForms = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

export default function ConjugationPage() {
  const [verbs, setVerbs] = useState<Verb[]>([]);
  const [selectedVerb, setSelectedVerb] = useState<number | null>(null);
  const [conjugations, setConjugations] = useState<Conjugation[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [infinitive, setInfinitive] = useState("");
  const [root, setRoot] = useState("");
  const [form, setForm] = useState("");

  const fetchVerbs = async () => {
    const res = await fetch("/api/conjugation");
    const data = await res.json();
    setVerbs(data);
  };

  const fetchConjugations = async (verbId: number) => {
    setLoading(true);
    const res = await fetch(`/api/conjugation/${verbId}`);
    const data = await res.json();
    setConjugations(data.conjugations || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchVerbs();
  }, []);

  useEffect(() => {
    if (selectedVerb) {
      fetchConjugations(selectedVerb);
    }
  }, [selectedVerb]);

  const handleGenerate = async () => {
    if (!infinitive) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/conjugation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          infinitive,
          root: root || undefined,
          form: form || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success("Conjugation generated");
        setShowAdd(false);
        setInfinitive("");
        setRoot("");
        setForm("");
        await fetchVerbs();
        setSelectedVerb(data.verb.id);
      } else {
        const err = await res.json();
        toast.error(err.error || "Generation failed");
      }
    } catch {
      toast.error("Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (verbId: number) => {
    const res = await fetch(`/api/conjugation/${verbId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Verb deleted");
      if (selectedVerb === verbId) {
        setSelectedVerb(null);
        setConjugations([]);
      }
      fetchVerbs();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Conjugation</h1>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Verb
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Verb list sidebar */}
        <div className="space-y-2">
          {verbs.length === 0 ? (
            <p className="text-sm text-muted-foreground p-2">
              No verbs yet. Add one to generate conjugations.
            </p>
          ) : (
            verbs.map((verb) => (
              <Card
                key={verb.id}
                className={`cursor-pointer transition-colors ${
                  selectedVerb === verb.id
                    ? "border-primary"
                    : "hover:border-muted-foreground/30"
                }`}
                onClick={() => setSelectedVerb(verb.id)}
              >
                <CardHeader className="p-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base" dir="rtl">
                      {verb.infinitive}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(verb.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                  {(verb.root || verb.form) && (
                    <CardDescription className="text-xs">
                      {verb.root && `Root: ${verb.root}`}
                      {verb.root && verb.form && " · "}
                      {verb.form && `Form ${verb.form}`}
                    </CardDescription>
                  )}
                </CardHeader>
              </Card>
            ))
          )}
        </div>

        {/* Conjugation table */}
        <div className="md:col-span-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : selectedVerb && conjugations.length > 0 ? (
            <ConjugationTable conjugations={conjugations} />
          ) : selectedVerb ? (
            <p className="text-muted-foreground text-center py-12">
              No conjugations found for this verb.
            </p>
          ) : (
            <p className="text-muted-foreground text-center py-12">
              Select a verb to view its conjugation table.
            </p>
          )}
        </div>
      </div>

      {/* Add verb dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Conjugation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Verb (infinitive) *</Label>
              <Input
                dir="rtl"
                value={infinitive}
                onChange={(e) => setInfinitive(e.target.value)}
                placeholder="e.g. كَتَبَ"
              />
            </div>
            <div className="space-y-2">
              <Label>Root letters</Label>
              <Input
                dir="rtl"
                value={root}
                onChange={(e) => setRoot(e.target.value)}
                placeholder="e.g. ك ت ب"
              />
            </div>
            <div className="space-y-2">
              <Label>Arabic Form</Label>
              <Select onValueChange={setForm}>
                <SelectTrigger>
                  <SelectValue placeholder="Select form..." />
                </SelectTrigger>
                <SelectContent>
                  {arabicForms.map((f) => (
                    <SelectItem key={f} value={f}>
                      Form {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!infinitive || generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate with AI"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
