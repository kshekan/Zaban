import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { sql, lte, gte } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date().toISOString();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();

  const totalCards = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.flashcards)
    .get();

  const dueCards = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.flashcards)
    .where(lte(schema.flashcards.nextReview, now))
    .get();

  const reviewedToday = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.reviewHistory)
    .where(gte(schema.reviewHistory.reviewedAt, todayStr))
    .get();

  const totalVocab = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.vocab)
    .get();

  const totalVerbs = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.verbs)
    .get();

  return NextResponse.json({
    totalCards: totalCards?.count || 0,
    dueCards: dueCards?.count || 0,
    reviewedToday: reviewedToday?.count || 0,
    totalVocab: totalVocab?.count || 0,
    totalVerbs: totalVerbs?.count || 0,
  });
}
