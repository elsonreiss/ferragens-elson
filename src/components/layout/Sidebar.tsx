"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Boxes,
  Users,
  Truck,
  ShoppingCart,
  ReceiptText,
  FileSpreadsheet,
  BarChart3,
  Wallet,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/format";
import { User } from "@/domain/entities/User";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, active: true },
  { href: "/estoque", label: "Estoque", icon: Boxes, active: true },
  { href: "/clientes", label: "Clientes", icon: Users, active: true },
  { href: "/fornecedores", label: "Fornecedores", icon: Truck, active: true },
  { href: "/vendas", label: "Vendas", icon: ShoppingCart, active: true },
  { href: "/compras", label: "Compras", icon: ReceiptText, active: true },
  { href: "/financeiro", label: "Financeiro", icon: Wallet, active: true },
  { href: "/orcamentos", label: "Orçamentos", icon: FileSpreadsheet, active: true },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3, active: true },
];

// Rotas que o funcionário não pode ver nem acessar.
const RESTRICTED_FOR_FUNCIONARIO = new Set(["/financeiro", "/relatorios"]);

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => setUser(json.data))
      .catch(() => {});
  }, []);

  // Fecha o menu mobile automaticamente ao trocar de página.
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const navItems =
    user?.role === "funcionario"
      ? NAV_ITEMS.filter((item) => !RESTRICTED_FOR_FUNCIONARIO.has(item.href))
      : NAV_ITEMS;

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "app-sidebar fixed md:sticky top-0 left-0 h-screen shrink-0 bg-navy-900 text-white flex flex-col transition-all duration-200 z-50 w-64",
          collapsed ? "md:w-[76px]" : "md:w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10">
          <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0 p-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Ferragens do Elson" className="w-full h-full object-contain" />
          </div>
          {!collapsed && (
            <div className="leading-tight overflow-hidden flex-1">
              <p className="font-display font-semibold text-sm truncate">Ferragens do Elson</p>
              <p className="text-[11px] text-white/50 truncate">Painel de Gestão</p>
            </div>
          )}
          <button
            onClick={onClose}
            className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white shrink-0"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-2.5 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActivePage = pathname?.startsWith(item.href);
            const Icon = item.icon;
            if (!item.active) {
              return (
                <div
                  key={item.href}
                  title="Em breve"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/30 cursor-not-allowed select-none",
                    collapsed && "md:justify-center"
                  )}
                >
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && (
                    <span className="flex-1 flex items-center justify-between">
                      {item.label}
                      <span className="text-[9px] uppercase tracking-wide bg-white/10 rounded px-1.5 py-0.5">
                        em breve
                      </span>
                    </span>
                  )}
                </div>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  isActivePage ? "bg-orange-500 text-white" : "text-white/70 hover:bg-white/10 hover:text-white",
                  collapsed && "md:justify-center"
                )}
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-2.5 border-t border-white/10">
          <Link
            href="/configuracoes"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/50 hover:bg-white/10 hover:text-white transition-colors",
              collapsed && "md:justify-center"
            )}
          >
            <Settings size={18} className="shrink-0" />
            {!collapsed && <span>Configurações</span>}
          </Link>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="hidden md:flex mt-1 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/50 hover:bg-white/10 hover:text-white transition-colors"
          >
            {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
            {!collapsed && <span>Recolher</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
