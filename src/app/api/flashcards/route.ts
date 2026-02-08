import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { lte, asc, eq } from "drizzle-orm";
import { seedDefaults } from "@/lib/db/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  seedDefaults();

  const now = new Date().toISOString();

  // Get due cards: nextReview <= now
  // Priority: failed cards first (repetitions = 0 and interval > 0 means it was reset),
  // then lowest ease factor, then oldest due date
  const dueCards = db
    .select()
    .from(schema.flashcards)
    .where(lte(schema.flashcards.nextReview, now))
    .orderBy(
      asc(schema.flashcards.repetitions),
      asc(schema.flashcards.easeFactor),
      asc(schema.flashcards.nextReview)
    )
    .all();

  // Get total count for stats
  const allCards = db
    .select()
    .from(schema.flashcards)
    .all();

  return NextResponse.json({
    due: dueCards,
    totalCards: allCards.length,
    dueCount: dueCards.length,
  });
}
