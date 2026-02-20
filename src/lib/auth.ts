import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db),
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log("[auth] Missing email or password");
            return null;
          }

          const user = db
            .select()
            .from(schema.users)
            .where(eq(schema.users.email, credentials.email as string))
            .get();

          if (!user) {
            console.log("[auth] No user found for:", credentials.email);
            return null;
          }

          if (!user.password) {
            console.log("[auth] User has no password set");
            return null;
          }

          const passwordMatch = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          console.log("[auth] Password match:", passwordMatch, "for user:", user.email);

          if (!passwordMatch) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error("[auth] Authorize error:", error);
          return null;
        }
      },
    }),
  ],
});
