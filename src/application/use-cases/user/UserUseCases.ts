import { NewUserInput } from "@/domain/entities/User";
import { UserRepository } from "@/domain/repositories";

export class UserUseCases {
  constructor(private readonly repo: UserRepository) {}

  list() {
    return this.repo.findAll();
  }

  async create(input: NewUserInput) {
    if (!input.name?.trim()) throw new Error("O nome é obrigatório.");
    if (!input.email?.trim()) throw new Error("O e-mail é obrigatório.");
    if (!input.password || input.password.length < 6) throw new Error("A senha deve ter ao menos 6 caracteres.");
    const existing = await this.repo.findByEmailWithHash(input.email.trim().toLowerCase());
    if (existing) throw new Error("Já existe um usuário com este e-mail.");
    return this.repo.create({ ...input, email: input.email.trim().toLowerCase() });
  }

  async update(id: number, input: Partial<Omit<NewUserInput, "password">> & { password?: string }) {
    const current = await this.repo.findById(id);
    if (!current) throw new Error("Usuário não encontrado.");
    if (input.password && input.password.length < 6) throw new Error("A senha deve ter ao menos 6 caracteres.");
    if (input.photoUrl && input.photoUrl.length > 2_000_000) {
      throw new Error("A imagem é muito grande. Escolha uma foto menor.");
    }
    return this.repo.update(id, input);
  }

  async delete(id: number) {
    const current = await this.repo.findById(id);
    if (!current) throw new Error("Usuário não encontrado.");
    await this.repo.delete(id);
  }
}
