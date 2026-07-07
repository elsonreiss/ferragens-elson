export interface Product {
  id: number;
  code: string;
  barcode: string | null;
  name: string;
  categoryId: number | null;
  categoryName?: string;
  brand: string | null;
  unit: string;
  description: string | null;
  photoUrl: string | null;
  purchasePrice: number;
  salePrice: number;
  minStock: number;
  quantity: number;
  location: string | null;
  supplierId: number | null;
  supplierName?: string;
  createdAt: string;
  updatedAt: string;
}

export type StockStatus = "falta" | "baixo" | "ok";

export function getStockStatus(product: Pick<Product, "quantity" | "minStock">): StockStatus {
  if (product.quantity <= 0) return "falta";
  if (product.quantity <= product.minStock) return "baixo";
  return "ok";
}

export function profitMargin(product: Pick<Product, "purchasePrice" | "salePrice">): number {
  if (product.salePrice <= 0) return 0;
  return (product.salePrice - product.purchasePrice) / product.salePrice;
}

export interface NewProductInput {
  code: string;
  barcode?: string;
  name: string;
  categoryId?: number | null;
  brand?: string;
  unit: string;
  description?: string;
  photoUrl?: string;
  purchasePrice: number;
  salePrice: number;
  minStock: number;
  quantity: number;
  location?: string;
  supplierId?: number | null;
}
