import { NextRequest, NextResponse } from "next/server"

export function middleware(req: NextRequest) {
  const sessionCookie =
    req.cookies.get("authjs.session-token") ??
    req.cookies.get("__Secure-authjs.session-token")

  if (!sessionCookie) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/api/user/:path*"],
}
