import { NextRequest, NextResponse } from "next/server";
import { container } from "@/container";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email: string; password: string };
    const { user, token } = await container.authUseCases.login(body.email, body.password);
    const res = NextResponse.json({ data: user });
    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao entrar.";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
