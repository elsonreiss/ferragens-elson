import { NewProductInput, Product } from "@/domain/entities/Product";
import { ProductFilters, ProductRepository } from "@/domain/repositories/ProductRepository";

export class ProductUseCases {
  constructor(private readonly repo: ProductRepository) {}

  list(filters?: ProductFilters): Promise<Product[]> {
    return this.repo.findAll(filters);
  }

  getById(id: number): Promise<Product | null> {
    return this.repo.findById(id);
  }

  async create(input: NewProductInput): Promise<Product> {
    this.validate(input);
    const existing = await this.repo.findByCode(input.code);
    if (existing) throw new Error(`Já existe um produto com o código "${input.code}".`);
    return this.repo.create(input);
  }

  async update(id: number, input: Partial<NewProductInput>): Promise<Product> {
    const current = await this.repo.findById(id);
    if (!current) throw new Error("Produto não encontrado.");
    if (input.code && input.code !== current.code) {
      const existing = await this.repo.findByCode(input.code);
      if (existing) throw new Error(`Já existe um produto com o código "${input.code}".`);
    }
    return this.repo.update(id, input);
  }

  async delete(id: number): Promise<void> {
    const current = await this.repo.findById(id);
    if (!current) throw new Error("Produto não encontrado.");
    await this.repo.delete(id);
  }

  private validate(input: NewProductInput) {
    if (!input.code?.trim()) throw new Error("O código do produto é obrigatório.");
    if (!input.name?.trim()) throw new Error("O nome do produto é obrigatório.");
    if (input.purchasePrice < 0 || input.salePrice < 0) throw new Error("Preços não podem ser negativos.");
    if (input.quantity < 0) throw new Error("Quantidade não pode ser negativa.");
    if (input.minStock < 0) throw new Error("Estoque mínimo não pode ser negativo.");
  }
}
