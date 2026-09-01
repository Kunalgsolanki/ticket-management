
import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("ticket_token")?.value;
  const user = request.cookies.get("ticket_user")?.value;

  const pathname = request.nextUrl.pathname;

  // User is logged in
  if (token && user) {
    try {
      const parsedUser = JSON.parse(user);

      // If logged-in user visits home/login/register
      if (
        pathname === "/" ||
        pathname === "/login" ||
        pathname === "/register"
      ) {
        if (parsedUser.role === "ADMIN") {
          return NextResponse.redirect(
            new URL("/dashboard/admin", request.url)
          );
        }

        return NextResponse.redirect(
          new URL("/dashboard", request.url)
        );
      }
    } catch (error) {
      console.error("Invalid user cookie");
    }
  }

  // User is NOT logged in but tries dashboard
  if (!token && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/dashboard/:path*",
  ],
};

