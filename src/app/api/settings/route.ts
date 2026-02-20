import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { seedDefaults } from "@/lib/db/seed";
import { getAuthenticatedUserId } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  seedDefaults();

  const userId = await getAuthenticatedUserId();
  if (userId instanceof NextResponse) return userId;

  const rows = db
    .select()
    .from(schema.settings)
    .where(eq(schema.settings.userId, userId))
    .all();
  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
  seedDefaults();

  const userId = await getAuthenticatedUserId();
  if (userId instanceof NextResponse) return userId;

  const body = await request.json();

  for (const [key, value] of Object.entries(body)) {
    const existing = db
      .select()
      .from(schema.settings)
      .where(and(eq(schema.settings.userId, userId), eq(schema.settings.key, key)))
      .get();

    if (existing) {
      db.update(schema.settings)
        .set({ value: String(value), updatedAt: new Date().toISOString() })
        .where(and(eq(schema.settings.userId, userId), eq(schema.settings.key, key)))
        .run();
    } else {
      db.insert(schema.settings)
        .values({ userId, key, value: String(value) })
        .run();
    }
  }

  return NextResponse.json({ success: true });
}
