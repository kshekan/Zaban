"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TargetText } from "@/components/target-text";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

interface Mistake {
  type: string;
  explanation: string;
}

interface ScoringResult {
  score: number;
  correct: boolean;
  correctedText: string;
  transliteration: string;
  mistakes: Mistake[];
  feedback: string;
}

export function PracticeMode() {
  const [english, setEnglish] = useState("");
  const [attempt, setAttempt] = useState("");
  const [result, setResult] = useState<ScoringResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!english.trim() || !attempt.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/translate/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ english, attempt }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        const err = await res.json();
        toast.error(err.error || "Scoring failed");
      }
    } catch {
      toast.error("Scoring failed");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setEnglish("");
    setAttempt("");
    setResult(null);
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <p className="text-sm text-muted-foreground">
        Type an English sentence and your Arabic translation attempt. AI will
        score and correct it.
      </p>

      <div className="space-y-3">
        <div className="space-y-2">
          <Label>English sentence</Label>
          <Input
            value={english}
            onChange={(e) => setEnglish(e.target.value)}
            placeholder="e.g. The book is on the table"
            disabled={!!result}
          />
        </div>
        <div className="space-y-2">
          <Label>Your Arabic translation</Label>
          <Textarea
            value={attempt}
            onChange={(e) => setAttempt(e.target.value)}
            placeholder="Type your Arabic attempt here..."
            dir="rtl"
            rows={2}
            disabled={!!result}
          />
        </div>

        {!result ? (
          <Button
            onClick={handleSubmit}
            disabled={!english.trim() || !attempt.trim() || loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Checking...
              </>
            ) : (
              "Check Translation"
            )}
          </Button>
        ) : (
          <Button onClick={handleNext}>Next Sentence</Button>
        )}
      </div>

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                {result.correct ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                Score: {result.score}/100
              </CardTitle>
              <Badge
                variant={result.correct ? "default" : "destructive"}
              >
                {result.correct ? "Correct" : "Needs Work"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Correct translation
              </p>
              <TargetText className="text-xl font-bold">
                {result.correctedText}
              </TargetText>
              <p className="text-sm text-muted-foreground mt-1">
                {result.transliteration}
              </p>
            </div>

            {result.mistakes.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Mistakes</p>
                <div className="space-y-2">
                  {result.mistakes.map((mistake, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-sm"
                    >
                      <Badge variant="outline" className="text-xs shrink-0">
                        {mistake.type}
                      </Badge>
                      <p>{mistake.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground mb-1">Feedback</p>
              <p className="text-sm">{result.feedback}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
