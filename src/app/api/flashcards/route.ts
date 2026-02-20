import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { lte, asc, eq, and, lt, or, sql } from "drizzle-orm";
import { seedDefaults } from "@/lib/db/seed";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  seedDefaults();

  const userId = await getAuthenticatedUserId();
  if (userId instanceof NextResponse) return userId;

  const lang = request.nextUrl.searchParams.get("lang") || "ar";
  const cardType = request.nextUrl.searchParams.get("cardType");
  const mode = request.nextUrl.searchParams.get("mode");
  const now = new Date().toISOString();

  const conditions = [
    eq(schema.flashcards.userId, userId),
    eq(schema.flashcards.languageCode, lang),
  ];
  if (cardType === "vocab" || cardType === "conjugation") {
    conditions.push(eq(schema.flashcards.cardType, cardType));
  }

  const baseFilter = and(...conditions);

  // Count due cards
  const dueCount = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.flashcards)
    .where(and(baseFilter, lte(schema.flashcards.nextReview, now)))
    .get();

  if (mode === "weakest") {
    // Weakest mode: cards with easeFactor below default (2.5) or never reviewed
    const weakCards = db
      .select()
      .from(schema.flashcards)
      .where(
        and(
          baseFilter,
          or(
            lt(schema.flashcards.easeFactor, 2.5),
            eq(schema.flashcards.repetitions, 0)
          )
        )
      )
      .orderBy(asc(schema.flashcards.easeFactor), asc(schema.flashcards.repetitions))
      .all();

    return NextResponse.json({
      cards: weakCards,
      totalCards: weakCards.length,
      dueCount: dueCount?.count || 0,
      mode: "weakest",
    });
  }

  // Default mode: all cards, due first, then by soonest nextReview
  const allCards = db
    .select()
    .from(schema.flashcards)
    .where(baseFilter)
    .orderBy(
      // Due cards first (nextReview <= now sorts before future dates)
      sql`CASE WHEN ${schema.flashcards.nextReview} <= ${now} THEN 0 ELSE 1 END`,
      asc(schema.flashcards.nextReview),
      asc(schema.flashcards.easeFactor)
    )
    .all();

  return NextResponse.json({
    cards: allCards,
    totalCards: allCards.length,
    dueCount: dueCount?.count || 0,
  });
}
