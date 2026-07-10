export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

// Converte o texto de data/hora vindo do banco (SQLite: "2026-07-07 14:23:10",
// Postgres: "2026-07-07 14:23:10.123456+00" ou "2026-07-07") num Date válido.
function parseDbDate(raw: string): Date {
  let s = raw.trim();
  const spaceIdx = s.indexOf(" ");
  if (spaceIdx === -1) return new Date(s); // só data, ex: "2026-07-07"
  s = `${s.slice(0, spaceIdx)}T${s.slice(spaceIdx + 1)}`;
  s = s.replace(/([+-]\d{2})$/, "$1:00"); // "+00" -> "+00:00"
  if (!/[zZ]|[+-]\d{2}:\d{2}$/.test(s)) s += "Z"; // sem offset explícito: assume UTC
  return new Date(s);
}

// Fixa o fuso em horário de Brasília na formatação — sem isso, o resultado
// depende do fuso do processo Node (UTC em produção na Vercel), fazendo
// horários exibidos ficarem 3h adiantados em relação ao horário local.
const BR_TZ = "America/Sao_Paulo";

export function formatDateTime(iso: string): string {
  const date = parseDbDate(iso);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: BR_TZ,
  }).format(date);
}

export function formatDate(iso: string): string {
  const date = parseDbDate(iso);
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: BR_TZ }).format(date);
}

export function formatMonthLabel(yyyyMm: string): string {
  const [year, month] = yyyyMm.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" }).format(date);
}

export function formatDayLabel(yyyyMmDd: string): string {
  const date = new Date(`${yyyyMmDd}T00:00:00`);
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date);
}

export function formatWeekLabel(mondayYyyyMmDd: string): string {
  const start = new Date(`${mondayYyyyMmDd}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });
  return `${fmt.format(start)} - ${fmt.format(end)}`;
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
