export interface PurchaseItem {
  id: number;
  productId: number | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Purchase {
  id: number;
  supplierId: number | null;
  supplierName: string | null;
  items: PurchaseItem[];
  total: number;
  paymentMethod: string | null;
  notes: string | null;
  createdAt: string;
}

export interface NewPurchaseItemInput {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface NewPurchaseInput {
  supplierId?: number | null;
  paymentMethod?: string;
  notes?: string;
  items: NewPurchaseItemInput[];
}
