import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const verb = db
    .select()
    .from(schema.verbs)
    .where(eq(schema.verbs.id, parseInt(id)))
    .get();

  if (!verb) {
    return NextResponse.json({ error: "Verb not found" }, { status: 404 });
  }

  const conjugations = db
    .select()
    .from(schema.conjugations)
    .where(eq(schema.conjugations.verbId, verb.id))
    .all();

  return NextResponse.json({ verb, conjugations });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const verb = db
    .select()
    .from(schema.verbs)
    .where(eq(schema.verbs.id, parseInt(id)))
    .get();

  if (!verb) {
    return NextResponse.json({ error: "Verb not found" }, { status: 404 });
  }

  db.delete(schema.verbs).where(eq(schema.verbs.id, parseInt(id))).run();

  return NextResponse.json({ success: true });
}
