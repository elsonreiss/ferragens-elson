// Utilitários para gerar chaves de data ("YYYY-MM-DD") alinhadas ao dia civil
// de Brasília, independente do fuso horário do processo Node (em produção na
// Vercel, por exemplo, o servidor roda em UTC). Usado nas agregações de
// faturamento/fluxo por dia e por semana nos repositórios de dashboard e
// financeiro, para que "hoje" e "essa semana" batam com o horário local.

const BR_TZ = "America/Sao_Paulo";

// Formata um instante (Date) como "YYYY-MM-DD" já considerando o fuso de
// Brasília — o locale "en-CA" produz esse formato nativamente.
export function saoPauloDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: BR_TZ }).format(date);
}

// Dado um dia (chave "YYYY-MM-DD", já em horário de Brasília), retorna a
// chave da segunda-feira daquela semana. Ancora ao meio-dia UTC para não
// sofrer efeito de fuso na virada do dia.
export function mondayKeyOf(dayKey: string): string {
  const d = new Date(`${dayKey}T12:00:00Z`);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}
