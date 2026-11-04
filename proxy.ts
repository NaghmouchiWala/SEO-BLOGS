import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "satellite_dashboard_session";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Brand images are needed by the login page itself, before there is a session.
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/login") ||
    /^\/(logo_transparent(_light)?\.webp|galylio-mark\.svg)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET);
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
