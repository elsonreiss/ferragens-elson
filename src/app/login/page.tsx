import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Ferragens do Elson" className="w-20 h-20" />
          <div className="text-center">
            <p className="font-display font-semibold text-lg">Ferragens do Elson</p>
            <p className="text-xs text-text-muted">Painel de Gestão</p>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl shadow-sm p-6 w-full">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
