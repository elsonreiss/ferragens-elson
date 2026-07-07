export interface Client {
  id: number;
  name: string;
  document: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  notes: string | null;
  createdAt: string;
}

export interface NewClientInput {
  name: string;
  document?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  notes?: string;
}

export interface ClientFilters {
  search?: string;
}
