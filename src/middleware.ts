import { auth } from "@/lib/auth/config";

export default auth((req) => {
  const publicPaths = ["/login", "/signup"];
  if (!req.auth && !publicPaths.includes(req.nextUrl.pathname)) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
