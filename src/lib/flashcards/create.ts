import { db, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";

export function createVocabFlashcard(vocabId: number, userId: string) {
  const vocab = db
    .select()
    .from(schema.vocab)
    .where(eq(schema.vocab.id, vocabId))
    .get();

  if (!vocab) return;

  // Skip flashcard creation for untranslated words
  if (!vocab.target) return;

  // Check if flashcard already exists for this vocab
  const existing = db
    .select()
    .from(schema.flashcards)
    .where(
      and(
        eq(schema.flashcards.vocabId, vocabId),
        eq(schema.flashcards.cardType, "vocab")
      )
    )
    .get();

  if (existing) return;

  db.insert(schema.flashcards)
    .values({
      userId,
      languageCode: vocab.languageCode,
      vocabId: vocab.id,
      cardType: "vocab",
      front: vocab.english,
      back: vocab.target,
    })
    .run();
}

export function createConjugationFlashcards(verbId: number, userId: string) {
  const verb = db
    .select()
    .from(schema.verbs)
    .where(eq(schema.verbs.id, verbId))
    .get();

  if (!verb) return;

  const conjugations = db
    .select()
    .from(schema.conjugations)
    .where(eq(schema.conjugations.verbId, verbId))
    .all();

  for (const conj of conjugations) {
    // Check if flashcard already exists
    const existing = db
      .select()
      .from(schema.flashcards)
      .where(
        and(
          eq(schema.flashcards.conjugationId, conj.id),
          eq(schema.flashcards.cardType, "conjugation")
        )
      )
      .get();

    if (existing) continue;

    db.insert(schema.flashcards)
      .values({
        userId,
        languageCode: verb.languageCode,
        conjugationId: conj.id,
        cardType: "conjugation",
        front: `${verb.infinitive} — ${conj.tense} / ${conj.person}`,
        back: conj.voweled || conj.conjugated,
      })
      .run();
  }
}
