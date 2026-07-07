export interface MonthlyFinance {
  mes: string;
  receitas: number;
  despesas: number;
}

export interface SlowMovingProduct {
  id: number;
  code: string;
  name: string;
  quantity: number;
  lastMovementAt: string | null;
}

export interface StockValuationRow {
  id: number;
  code: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  total: number;
}
