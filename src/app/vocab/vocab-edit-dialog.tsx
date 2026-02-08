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

interface VocabEditDialogProps {
  item: {
    id: number;
    english: string;
    target: string;
    transliteration: string | null;
    partOfSpeech: string | null;
    tags: string | null;
    notes: string | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function VocabEditDialog({
  item,
  open,
  onOpenChange,
  onSuccess,
}: VocabEditDialogProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VocabFormData>({
    resolver: zodResolver(vocabSchema),
    defaultValues: {
      english: item.english,
      target: item.target,
      transliteration: item.transliteration || "",
      partOfSpeech: item.partOfSpeech || "",
      tags: item.tags || "",
      notes: item.notes || "",
    },
  });

  const onSubmit = async (data: VocabFormData) => {
    const res = await fetch(`/api/vocab/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      toast.success("Word updated");
      onOpenChange(false);
      onSuccess();
    } else {
      toast.error("Failed to update word");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Vocabulary</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-english">English *</Label>
            <Input id="edit-english" {...register("english")} />
            {errors.english && (
              <p className="text-sm text-destructive">
                {errors.english.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-target">Target Language *</Label>
            <Input id="edit-target" dir="rtl" {...register("target")} />
            {errors.target && (
              <p className="text-sm text-destructive">
                {errors.target.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-transliteration">Transliteration</Label>
            <Input
              id="edit-transliteration"
              {...register("transliteration")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-partOfSpeech">Part of Speech</Label>
            <Select
              defaultValue={item.partOfSpeech || undefined}
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
            <Label htmlFor="edit-tags">Tags</Label>
            <Input id="edit-tags" {...register("tags")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea id="edit-notes" {...register("notes")} rows={2} />
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
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
