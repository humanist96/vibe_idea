import { auth } from "../auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isUserApi = req.nextUrl.pathname.startsWith("/api/user")
  if (isUserApi && !req.auth) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    )
  }
  return NextResponse.next()
})

export const config = {
  matcher: ["/api/user/:path*"],
}
