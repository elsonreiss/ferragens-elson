import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  basePath: string;
}

// Paginação simples baseada em navegação (Links com ?page=N), sem estado no
// cliente — cada clique refaz a busca no servidor com a página pedida.
export function Pagination({ page, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null;

  const prevPage = Math.max(1, page - 1);
  const nextPage = Math.min(totalPages, page + 1);
  const atStart = page <= 1;
  const atEnd = page >= totalPages;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm text-text-muted">
      <span>
        Página {page} de {totalPages}
      </span>
      <div className="flex items-center gap-2">
        <Link
          href={`${basePath}?page=${prevPage}`}
          aria-disabled={atStart}
          tabIndex={atStart ? -1 : undefined}
          className={`w-8 h-8 rounded-lg inline-flex items-center justify-center border border-border transition-colors ${
            atStart ? "pointer-events-none opacity-40" : "hover:bg-bg"
          }`}
        >
          <ChevronLeft size={16} />
        </Link>
        <Link
          href={`${basePath}?page=${nextPage}`}
          aria-disabled={atEnd}
          tabIndex={atEnd ? -1 : undefined}
          className={`w-8 h-8 rounded-lg inline-flex items-center justify-center border border-border transition-colors ${
            atEnd ? "pointer-events-none opacity-40" : "hover:bg-bg"
          }`}
        >
          <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
}
