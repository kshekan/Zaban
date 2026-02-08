"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const vocabSchema = z.object({
  english: z.string().min(1, "Required"),
  target: z.string().min(1, "Required"),
  transliteration: z.string().optional(),
  partOfSpeech: z.string().optional(),
  tags: z.string().optional(),
  notes: z.string().optional(),
});

type VocabFormData = z.infer<typeof vocabSchema>;

const partsOfSpeech = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "preposition",
  "pronoun",
  "conjunction",
  "interjection",
  "particle",
  "phrase",
];

interface VocabFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function VocabForm({ open, onOpenChange, onSuccess }: VocabFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VocabFormData>({
    resolver: zodResolver(vocabSchema),
  });

  const onSubmit = async (data: VocabFormData) => {
    const res = await fetch("/api/vocab", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      toast.success("Word added");
      reset();
      onOpenChange(false);
      onSuccess();
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to add word");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Vocabulary</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="english">English *</Label>
            <Input id="english" {...register("english")} />
            {errors.english && (
              <p className="text-sm text-destructive">
                {errors.english.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="target">Target Language *</Label>
            <Input id="target" dir="rtl" {...register("target")} />
            {errors.target && (
              <p className="text-sm text-destructive">
                {errors.target.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="transliteration">Transliteration</Label>
            <Input
              id="transliteration"
              {...register("transliteration")}
              placeholder="e.g. kitāb"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="partOfSpeech">Part of Speech</Label>
            <Select
              onValueChange={(v) => setValue("partOfSpeech", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {partsOfSpeech.map((pos) => (
                  <SelectItem key={pos} value={pos}>
                    {pos.charAt(0).toUpperCase() + pos.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              {...register("tags")}
              placeholder="e.g. greetings, daily"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register("notes")} rows={2} />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Word"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
