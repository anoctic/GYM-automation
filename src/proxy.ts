import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/auth/session";

const PUBLIC_STATIC_PREFIXES = [
  "/_next",
  "/icons",
  "/favicon.ico",
  "/manifest.json",
  "/sw.js",
  "/fitness-planet-logo.png",
  "/fitness-planet-logo.jpg",
  "/apple-touch-icon.png",
  "/logo.jpg",
];

function isStaticAsset(pathname: string): boolean {
  if (PUBLIC_STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }
  return /\.(?:png|jpg|jpeg|svg|webp|ico|css|js|woff2?|json)$/i.test(pathname);
}

function hasSupabaseAuthCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token") && !!c.value);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  // Always allow public kiosk & self-enrollment registration windows
  if (pathname.startsWith("/checkin") || pathname.startsWith("/join")) {
    return NextResponse.next();
  }

  // Allow public admission submissions via API POST
  if (pathname === "/api/admissions" && request.method === "POST") {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifyAdminSessionToken(sessionToken);
  const isAuthenticated = Boolean(session) || hasSupabaseAuthCookie(request);

  // If visiting /login while already authenticated, send to dashboard
  if (pathname === "/login") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Protect all remaining app routes & admin APIs
  if (!isAuthenticated) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
