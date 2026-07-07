import { NewClientInput, ClientFilters } from "@/domain/entities/Client";
import { ClientRepository } from "@/domain/repositories";

export class ClientUseCases {
  constructor(private readonly repo: ClientRepository) {}

  list(filters?: ClientFilters) {
    return this.repo.findAll(filters);
  }

  getById(id: number) {
    return this.repo.findById(id);
  }

  create(input: NewClientInput) {
    this.validate(input);
    return this.repo.create(input);
  }

  async update(id: number, input: Partial<NewClientInput>) {
    const current = await this.repo.findById(id);
    if (!current) throw new Error("Cliente não encontrado.");
    return this.repo.update(id, input);
  }

  async delete(id: number) {
    const current = await this.repo.findById(id);
    if (!current) throw new Error("Cliente não encontrado.");
    await this.repo.delete(id);
  }

  private validate(input: NewClientInput) {
    if (!input.name?.trim()) throw new Error("O nome do cliente é obrigatório.");
  }
}
