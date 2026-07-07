export interface BudgetItem {
  id: number;
  productId: number | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export type BudgetStatus = "aberto" | "aprovado" | "recusado" | "convertido";

export interface Budget {
  id: number;
  clientId: number | null;
  clientName: string | null;
  items: BudgetItem[];
  discount: number;
  total: number;
  status: BudgetStatus;
  validUntil: string | null;
  notes: string | null;
  createdAt: string;
}

export interface NewBudgetItemInput {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface NewBudgetInput {
  clientId?: number | null;
  clientName?: string;
  discount?: number;
  validUntil?: string;
  notes?: string;
  items: NewBudgetItemInput[];
}
