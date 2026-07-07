import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

// Em Next.js 16, o antigo "middleware" passou a se chamar "proxy".
// Esta é uma checagem otimista (só olha se o cookie de sessão existe).
// A validação completa (sessão expirada, usuário desativado etc.) acontece
// no layout do grupo (app), que consulta o banco de dados.

const PUBLIC_ROUTES = ["/login"];

export default function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublicRoute = PUBLIC_ROUTES.some((r) => path === r || path.startsWith(r + "/"));
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (!isPublicRoute && !hasSession) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (isPublicRoute && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|logo.svg).*)"],
};
