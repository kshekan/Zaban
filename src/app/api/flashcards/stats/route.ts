import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { sql, lte, lt, gte, eq, and, or } from "drizzle-orm";
import { seedDefaults } from "@/lib/db/seed";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  seedDefaults();

  const userId = await getAuthenticatedUserId();
  if (userId instanceof NextResponse) return userId;

  const lang = request.nextUrl.searchParams.get("lang") || "ar";
  const cardType = request.nextUrl.searchParams.get("cardType");
  const now = new Date().toISOString();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();

  const conditions = [
    eq(schema.flashcards.userId, userId),
    eq(schema.flashcards.languageCode, lang),
  ];
  if (cardType === "vocab" || cardType === "conjugation") {
    conditions.push(eq(schema.flashcards.cardType, cardType));
  }
  const baseFilter = and(...conditions);

  const totalCards = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.flashcards)
    .where(baseFilter)
    .get();

  const dueCards = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.flashcards)
    .where(and(baseFilter, lte(schema.flashcards.nextReview, now)))
    .get();

  // reviewedToday: join through flashcards to scope by user
  const reviewedToday = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.reviewHistory)
    .innerJoin(
      schema.flashcards,
      eq(schema.reviewHistory.flashcardId, schema.flashcards.id)
    )
    .where(
      and(
        eq(schema.flashcards.userId, userId),
        gte(schema.reviewHistory.reviewedAt, todayStr)
      )
    )
    .get();

  const totalVocab = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.vocab)
    .where(and(eq(schema.vocab.userId, userId), eq(schema.vocab.languageCode, lang)))
    .get();

  const totalVerbs = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.verbs)
    .where(and(eq(schema.verbs.userId, userId), eq(schema.verbs.languageCode, lang)))
    .get();

  const weakCards = db
    .select({ count: sql<number>`count(*)` })
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
    .get();

  return NextResponse.json({
    totalCards: totalCards?.count || 0,
    dueCards: dueCards?.count || 0,
    weakCount: weakCards?.count || 0,
    reviewedToday: reviewedToday?.count || 0,
    totalVocab: totalVocab?.count || 0,
    totalVerbs: totalVerbs?.count || 0,
  });
}
