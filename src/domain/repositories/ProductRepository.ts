import { NewProductInput, Product } from "../entities/Product";

export interface ProductFilters {
  search?: string;
  categoryId?: number;
  onlyLowStock?: boolean;
  onlyOutOfStock?: boolean;
}

export interface ProductRepository {
  findAll(filters?: ProductFilters): Promise<Product[]>;
  findById(id: number): Promise<Product | null>;
  findByCode(code: string): Promise<Product | null>;
  create(input: NewProductInput): Promise<Product>;
  update(id: number, input: Partial<NewProductInput>): Promise<Product>;
  delete(id: number): Promise<void>;
  adjustQuantity(id: number, delta: number): Promise<Product>;
  count(): Promise<number>;
  totalStockValue(): Promise<number>;
  countLowStock(): Promise<number>;
  countOutOfStock(): Promise<number>;
  topSelling(limit: number): Promise<Array<{ nome: string; quantidade: number }>>;
}
