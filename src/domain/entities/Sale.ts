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
  // Data/hora da venda em ISO 8601 (ex: "2026-07-10T14:30:00-03:00"). Opcional
  // — se não informado, o banco usa o momento atual (now()). Permite registrar
  // uma venda retroativa (de um dia anterior) para que ela conte no dia certo
  // nos relatórios e no dashboard.
  createdAt?: string;
}
