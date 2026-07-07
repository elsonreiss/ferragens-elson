import { NewSupplierInput, SupplierFilters } from "@/domain/entities/Common";
import { SupplierRepository } from "@/domain/repositories";

export class SupplierUseCases {
  constructor(private readonly repo: SupplierRepository) {}

  list(filters?: SupplierFilters) {
    return this.repo.findAll(filters);
  }

  getById(id: number) {
    return this.repo.findById(id);
  }

  create(input: NewSupplierInput) {
    this.validate(input);
    return this.repo.create(input);
  }

  async update(id: number, input: Partial<NewSupplierInput>) {
    const current = await this.repo.findById(id);
    if (!current) throw new Error("Fornecedor não encontrado.");
    return this.repo.update(id, input);
  }

  async delete(id: number) {
    const current = await this.repo.findById(id);
    if (!current) throw new Error("Fornecedor não encontrado.");
    await this.repo.delete(id);
  }

  private validate(input: NewSupplierInput) {
    if (!input.name?.trim()) throw new Error("O nome do fornecedor é obrigatório.");
  }
}
