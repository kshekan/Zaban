import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

export default async function middleware(request: NextRequest) {
  return (auth as any)(request);
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon\\.ico).*)",
  ],
};
