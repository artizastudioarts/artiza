import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Stripe calls this directly from their own servers — never gate it,
  // or order confirmations silently stop working during testing.
  if (pathname === "/api/webhook") {
    return NextResponse.next();
  }

  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const cookie = req.cookies.get("admin_session");
    if (cookie?.value !== process.env.ADMIN_PASSWORD) {
      const loginUrl = new URL("/admin/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Site-wide password gate — only active while SITE_ACCESS_PASSWORD is
  // set in Vercel. Remove that env var (and redeploy) to open the site
  // back up to everyone with zero code changes.
  const sitePassword = process.env.SITE_ACCESS_PASSWORD;
  if (sitePassword) {
    if (pathname === "/site-locked" || pathname === "/api/site-access") {
      return NextResponse.next();
    }
    const cookie = req.cookies.get("site_access");
    if (cookie?.value !== sitePassword) {
      const lockedUrl = new URL("/site-locked", req.url);
      lockedUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(lockedUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Runs on every request except Next's own static/image internals —
  // needed so the site-wide gate above actually covers the whole site,
  // not just /admin like before.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
