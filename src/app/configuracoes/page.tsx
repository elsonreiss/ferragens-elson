import { cookies } from "next/headers";
import { Card } from "@/components/ui/Card";
import { Settings, Moon } from "lucide-react";
import { container } from "@/container";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { UsersPanel } from "@/components/configuracoes/UsersPanel";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const currentUser = token ? await container.authUseCases.getUserByToken(token) : null;
  const isAdmin = currentUser?.role === "admin";
  const users = isAdmin ? await container.userUseCases.list() : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display font-semibold text-2xl">Configurações</h1>
        <p className="text-text-muted text-sm mt-1">Preferências gerais do sistema.</p>
      </div>

      {isAdmin && currentUser ? (
        <UsersPanel users={users} currentUserId={currentUser.id} />
      ) : (
        <Card className="p-10 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-navy-700/10 text-navy-700 dark:text-blue-500 flex items-center justify-center">
            <Settings size={22} />
          </div>
          <p className="font-medium">Acesso restrito</p>
          <p className="text-sm text-text-muted max-w-sm">
            Apenas administradores podem gerenciar usuários e permissões.
          </p>
        </Card>
      )}

      <Card className="p-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center">
          <Moon size={18} />
        </div>
        <div>
          <p className="text-sm font-medium">Tema</p>
          <p className="text-xs text-text-muted">Alterne entre modo claro e escuro pelo botão no topo da tela.</p>
        </div>
      </Card>
    </div>
  );
}
