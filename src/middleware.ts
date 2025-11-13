import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAuth = !!token;
  const isAuthPage =
    req.nextUrl.pathname.startsWith("/auth/login") ||
    req.nextUrl.pathname.startsWith("/auth/setup");

  // Si está en página de auth y ya está autenticado, redirigir a dashboard
  if (isAuthPage && isAuth) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Si no está autenticado y trata de acceder a rutas protegidas
  if (!isAuth && !isAuthPage && req.nextUrl.pathname.startsWith("/")) {
    // Rutas que requieren autenticación
    const protectedRoutes = ["/dashboard", "/admin", "/worker"];
    const isProtectedRoute = protectedRoutes.some((route) =>
      req.nextUrl.pathname.startsWith(route)
    );

    if (isProtectedRoute) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
  }

  // Verificar permisos por rol
  if (isAuth) {
    // Verificar si es admin para rutas de admin
    if (req.nextUrl.pathname.startsWith("/admin")) {
      if (token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Verificar si es worker para rutas de worker
    if (req.nextUrl.pathname.startsWith("/worker")) {
      if (token?.role !== "WORKER") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/worker/:path*",
    "/auth/login",
    "/auth/setup",
  ],
};
