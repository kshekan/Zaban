import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthenticatedUserId();
  if (userId instanceof NextResponse) return userId;

  const { id } = await params;

  const existing = db
    .select()
    .from(schema.translations)
    .where(
      and(
        eq(schema.translations.id, parseInt(id)),
        eq(schema.translations.userId, userId)
      )
    )
    .get();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  db.delete(schema.translations)
    .where(
      and(
        eq(schema.translations.id, parseInt(id)),
        eq(schema.translations.userId, userId)
      )
    )
    .run();

  return NextResponse.json({ success: true });
}
