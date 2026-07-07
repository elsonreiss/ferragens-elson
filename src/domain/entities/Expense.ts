export interface Expense {
  id: number;
  description: string;
  category: string | null;
  amount: number;
  createdAt: string;
}

export interface NewExpenseInput {
  description: string;
  category?: string;
  amount: number;
  createdAt?: string;
}

export interface FinanceSummary {
  receitasMes: number;
  despesasMes: number;
  saldoMes: number;
  despesasPorCategoria: Array<{ categoria: string; total: number }>;
  fluxoPorDia: Array<{ dia: string; receitas: number; despesas: number }>;
  despesasRecentes: Expense[];
}
