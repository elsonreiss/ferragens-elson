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
  // Se productId não for informado, é um item avulso: productName é
  // obrigatório e o item não afeta o estoque (não está cadastrado).
  productId?: number | null;
  productName?: string;
  quantity: number;
  unitPrice: number;
}

export interface NewSaleInput {
  clientId?: number | null;
  clientName?: string;
  paymentMethod?: string;
  items: NewSaleItemInput[];
}
