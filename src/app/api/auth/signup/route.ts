import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { seedDefaults } from "@/lib/db/seed";

export async function POST(request: NextRequest) {
  try {
    seedDefaults();

    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const existing = db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .get();

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = db
      .insert(schema.users)
      .values({
        email,
        password: hashedPassword,
        name: name || email.split("@")[0],
      })
      .returning()
      .get();

    // Seed default settings for the new user
    db.insert(schema.settings)
      .values([
        { userId: user.id, key: "activeLanguage", value: "ar" },
        { userId: user.id, key: "aiProvider", value: "anthropic" },
        { userId: user.id, key: "aiModel", value: "claude-sonnet-4-5-20250929" },
        { userId: user.id, key: "addresseeGender", value: "masculine" },
      ])
      .run();

    return NextResponse.json(
      { message: "Account created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: `Signup failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
