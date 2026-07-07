"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Field, Input } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao entrar.");
      const next = searchParams.get("next") || "/dashboard";
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
      <Field label="E-mail" required>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required autoFocus />
      </Field>
      <Field label="Senha" required>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
      </Field>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full justify-center mt-2">
        {loading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
