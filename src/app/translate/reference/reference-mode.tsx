"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TargetText } from "@/components/target-text";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TranslationResult {
  translation: string;
  transliteration: string;
  notes: string;
}

export function ReferenceMode() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTranslate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/translate/reference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        const err = await res.json();
        toast.error(err.error || "Translation failed");
      }
    } catch {
      toast.error("Translation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <p className="text-sm text-muted-foreground">
        Enter English text to get an Arabic translation.
      </p>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type English text here..."
        rows={3}
      />
      <Button onClick={handleTranslate} disabled={!text.trim() || loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            Translating...
          </>
        ) : (
          "Translate"
        )}
      </Button>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Translation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Arabic</p>
              <TargetText className="text-2xl font-bold">
                {result.translation}
              </TargetText>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Transliteration
              </p>
              <p className="text-lg">{result.transliteration}</p>
            </div>
            {result.notes && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Notes</p>
                <p className="text-sm">{result.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
