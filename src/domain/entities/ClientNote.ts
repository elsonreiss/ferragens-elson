export interface ClientNoteItem {
  id: number;
  noteId: number;
  productId: number | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  addedAt: string;
}

export interface ClientNotePayment {
  id: number;
  noteId: number;
  amount: number;
  method: string | null;
  notes: string | null;
  createdAt: string;
}

export interface ClientNote {
  id: number;
  clientId: number;
  clientName: string;
  notes: string | null;
  items: ClientNoteItem[];
  payments: ClientNotePayment[];
  total: number;
  paidTotal: number;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface NewClientNoteItemInput {
  // Se productId não for informado, é um item avulso: productName é
  // obrigatório e o item não afeta o estoque (não está cadastrado).
  productId?: number | null;
  productName?: string;
  quantity: number;
  unitPrice: number;
}

export interface NewClientNotePaymentInput {
  amount: number;
  method?: string;
  notes?: string;
}
