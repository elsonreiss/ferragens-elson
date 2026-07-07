export interface SaleItem {
  id: number;
  productId: number | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  purchasePrice: number;
  subtotal: number;
}

export interface Sale {
  id: number;
  clientId: number | null;
  clientName: string | null;
  items: SaleItem[];
  total: number;
  profit: number;
  paymentMethod: string | null;
  createdAt: string;
}

export interface NewSaleItemInput {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface NewSaleInput {
  clientId?: number | null;
  clientName?: string;
  paymentMethod?: string;
  items: NewSaleItemInput[];
}
