import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { seedDefaults } from "@/lib/db/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  seedDefaults();

  const rows = db.select().from(schema.settings).all();
  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
  seedDefaults();

  const body = await request.json();

  for (const [key, value] of Object.entries(body)) {
    const existing = db
      .select()
      .from(schema.settings)
      .where(eq(schema.settings.key, key))
      .get();

    if (existing) {
      db.update(schema.settings)
        .set({ value: String(value), updatedAt: new Date().toISOString() })
        .where(eq(schema.settings.key, key))
        .run();
    } else {
      db.insert(schema.settings)
        .values({ key, value: String(value) })
        .run();
    }
  }

  return NextResponse.json({ success: true });
}
