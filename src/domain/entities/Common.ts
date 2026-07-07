export interface Category {
  id: number;
  name: string;
}

export interface Supplier {
  id: number;
  name: string;
  company: string | null;
  cnpj: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  notes: string | null;
}

export interface NewSupplierInput {
  name: string;
  company?: string;
  cnpj?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  notes?: string;
}

export interface SupplierFilters {
  search?: string;
}

export type MovementType = "entrada" | "saida" | "ajuste";

export interface StockMovement {
  id: number;
  productId: number;
  type: MovementType;
  quantity: number;
  reason: string | null;
  createdAt: string;
}

export interface NewStockMovementInput {
  productId: number;
  type: MovementType;
  quantity: number;
  reason?: string;
}
