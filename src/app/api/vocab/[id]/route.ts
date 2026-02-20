import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthenticatedUserId();
  if (userId instanceof NextResponse) return userId;

  const { id } = await params;
  const item = db
    .select()
    .from(schema.vocab)
    .where(and(eq(schema.vocab.id, parseInt(id)), eq(schema.vocab.userId, userId)))
    .get();

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(item);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthenticatedUserId();
  if (userId instanceof NextResponse) return userId;

  const { id } = await params;
  const body = await request.json();

  const existing = db
    .select()
    .from(schema.vocab)
    .where(and(eq(schema.vocab.id, parseInt(id)), eq(schema.vocab.userId, userId)))
    .get();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const result = db
    .update(schema.vocab)
    .set({
      ...body,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(schema.vocab.id, parseInt(id)), eq(schema.vocab.userId, userId)))
    .returning()
    .get();

  return NextResponse.json(result);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthenticatedUserId();
  if (userId instanceof NextResponse) return userId;

  const { id } = await params;

  const existing = db
    .select()
    .from(schema.vocab)
    .where(and(eq(schema.vocab.id, parseInt(id)), eq(schema.vocab.userId, userId)))
    .get();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  db.delete(schema.vocab)
    .where(and(eq(schema.vocab.id, parseInt(id)), eq(schema.vocab.userId, userId)))
    .run();

  return NextResponse.json({ success: true });
}
