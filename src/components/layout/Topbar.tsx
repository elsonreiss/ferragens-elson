"use client";

import { Search, Moon, Sun, Bell, LogOut, Package, User as UserIcon, Truck, Camera } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { User } from "@/domain/entities/User";
import { ROLE_LABELS } from "@/lib/auth";

interface SearchResult {
  id: number;
  label: string;
  href: string;
}

interface SearchResponse {
  produtos: SearchResult[];
  clientes: SearchResult[];
  fornecedores: SearchResult[];
}

// Redimensiona a imagem escolhida (canvas) e devolve um data URL JPEG
// compacto, para não sobrecarregar o banco com fotos gigantes.
function resizeImageToDataUrl(file: File, maxSize = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Arquivo de imagem inválido."));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Não foi possível processar a imagem."));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function Topbar() {
  const { theme, toggle } = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => setUser(json.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((json) => setResults(json.data))
        .catch(() => {});
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    window.addEventListener("mousedown", onClickOutside);
    return () => window.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/estoque?search=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
    }
  }

  function goTo(href: string) {
    router.push(href);
    setSearchOpen(false);
    setQuery("");
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Selecione um arquivo de imagem.");
      return;
    }
    setUploadingPhoto(true);
    setPhotoError(null);
    try {
      const photoUrl = await resizeImageToDataUrl(file);
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao salvar foto.");
      setUser(json.data);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Erro ao enviar foto.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  const initial = user?.name?.trim()?.[0]?.toUpperCase() ?? "E";
  const hasResults = results && (results.produtos.length > 0 || results.clientes.length > 0 || results.fornecedores.length > 0);

  return (
    <header className="app-topbar sticky top-0 z-10 h-16 flex items-center gap-4 border-b border-border bg-surface/80 backdrop-blur px-6">
      <div ref={searchBoxRef} className="relative flex-1 max-w-md">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              placeholder="Pesquisar produtos, clientes, fornecedores..."
              className="w-full rounded-lg border border-border bg-bg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500"
            />
          </div>
        </form>

        {searchOpen && query.trim().length >= 2 && (
          <div className="absolute left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-lg overflow-hidden z-20 max-h-96 overflow-y-auto scrollbar-thin">
            {!hasResults && (
              <p className="px-3 py-4 text-sm text-text-muted text-center">Nenhum resultado encontrado.</p>
            )}
            {results && results.produtos.length > 0 && (
              <div className="py-1">
                <p className="px-3 py-1 text-[10px] uppercase tracking-wide text-text-muted font-medium">Produtos</p>
                {results.produtos.map((r) => (
                  <button key={r.id} onClick={() => goTo(r.href)} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-bg text-left">
                    <Package size={14} className="text-text-muted shrink-0" /> <span className="truncate">{r.label}</span>
                  </button>
                ))}
              </div>
            )}
            {results && results.clientes.length > 0 && (
              <div className="py-1 border-t border-border">
                <p className="px-3 py-1 text-[10px] uppercase tracking-wide text-text-muted font-medium">Clientes</p>
                {results.clientes.map((r) => (
                  <button key={r.id} onClick={() => goTo(r.href)} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-bg text-left">
                    <UserIcon size={14} className="text-text-muted shrink-0" /> <span className="truncate">{r.label}</span>
                  </button>
                ))}
              </div>
            )}
            {results && results.fornecedores.length > 0 && (
              <div className="py-1 border-t border-border">
                <p className="px-3 py-1 text-[10px] uppercase tracking-wide text-text-muted font-medium">Fornecedores</p>
                {results.fornecedores.map((r) => (
                  <button key={r.id} onClick={() => goTo(r.href)} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-bg text-left">
                    <Truck size={14} className="text-text-muted shrink-0" /> <span className="truncate">{r.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button
          className="w-9 h-9 rounded-lg flex items-center justify-center text-text-muted hover:bg-bg hover:text-text transition-colors"
          title="Notificações"
        >
          <Bell size={18} />
        </button>
        <button
          onClick={toggle}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-text-muted hover:bg-bg hover:text-text transition-colors"
          title="Alternar tema"
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-9 h-9 rounded-full overflow-hidden bg-navy-700 text-white flex items-center justify-center font-display text-sm"
            title={user?.name ?? "Usuário"}
          >
            {user?.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              initial
            )}
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-60 bg-surface border border-border rounded-lg shadow-lg z-20 overflow-hidden">
                {user && (
                  <div className="px-3 py-2.5 border-b border-border flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-navy-700 text-white flex items-center justify-center font-display text-sm shrink-0">
                      {user.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        initial
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-text-muted truncate">{ROLE_LABELS[user.role] ?? user.role}</p>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-bg transition-colors disabled:opacity-50"
                >
                  <Camera size={15} /> {uploadingPhoto ? "Enviando..." : "Alterar foto"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                {photoError && <p className="px-3 pb-2 text-xs text-danger">{photoError}</p>}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-danger hover:bg-danger-bg transition-colors"
                >
                  <LogOut size={15} /> Sair
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
