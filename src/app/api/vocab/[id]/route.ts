import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = db
    .select()
    .from(schema.vocab)
    .where(eq(schema.vocab.id, parseInt(id)))
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
  const { id } = await params;
  const body = await request.json();

  const existing = db
    .select()
    .from(schema.vocab)
    .where(eq(schema.vocab.id, parseInt(id)))
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
    .where(eq(schema.vocab.id, parseInt(id)))
    .returning()
    .get();

  return NextResponse.json(result);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const existing = db
    .select()
    .from(schema.vocab)
    .where(eq(schema.vocab.id, parseInt(id)))
    .get();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  db.delete(schema.vocab).where(eq(schema.vocab.id, parseInt(id))).run();

  return NextResponse.json({ success: true });
}
