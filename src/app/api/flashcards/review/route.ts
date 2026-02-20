import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { sm2 } from "@/lib/srs/sm2";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (userId instanceof NextResponse) return userId;

  const body = await request.json();
  const { flashcardId, quality } = body as {
    flashcardId: number;
    quality: number;
  };

  if (flashcardId == null || quality == null) {
    return NextResponse.json(
      { error: "flashcardId and quality are required" },
      { status: 400 }
    );
  }

  if (quality < 0 || quality > 5) {
    return NextResponse.json(
      { error: "quality must be between 0 and 5" },
      { status: 400 }
    );
  }

  const card = db
    .select()
    .from(schema.flashcards)
    .where(and(eq(schema.flashcards.id, flashcardId), eq(schema.flashcards.userId, userId)))
    .get();

  if (!card) {
    return NextResponse.json(
      { error: "Flashcard not found" },
      { status: 404 }
    );
  }

  // Run SM-2 algorithm
  const result = sm2(
    {
      easeFactor: card.easeFactor,
      interval: card.interval,
      repetitions: card.repetitions,
    },
    quality
  );

  // Update flashcard
  db.update(schema.flashcards)
    .set({
      easeFactor: result.easeFactor,
      interval: result.interval,
      repetitions: result.repetitions,
      nextReview: result.nextReview.toISOString(),
    })
    .where(eq(schema.flashcards.id, flashcardId))
    .run();

  // Log review history
  db.insert(schema.reviewHistory)
    .values({
      flashcardId,
      quality,
      easeFactor: result.easeFactor,
      interval: result.interval,
    })
    .run();

  return NextResponse.json({
    flashcardId,
    quality,
    newState: {
      easeFactor: result.easeFactor,
      interval: result.interval,
      repetitions: result.repetitions,
      nextReview: result.nextReview.toISOString(),
    },
  });
}
