import { UserRepository, SessionRepository } from "@/domain/repositories";
import { verifyPassword } from "@/lib/auth";

export class AuthUseCases {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly sessionRepo: SessionRepository
  ) {}

  async login(email: string, password: string) {
    const user = await this.userRepo.findByEmailWithHash(email.trim().toLowerCase());
    if (!user || !user.active) throw new Error("E-mail ou senha inválidos.");
    if (!verifyPassword(password, user.passwordHash)) throw new Error("E-mail ou senha inválidos.");
    const session = await this.sessionRepo.create(user.id);
    const { passwordHash: _passwordHash, ...safeUser } = user;
    void _passwordHash;
    return { user: safeUser, token: session.token, expiresAt: session.expiresAt };
  }

  async logout(token: string) {
    await this.sessionRepo.delete(token);
  }

  async getUserByToken(token: string) {
    const session = await this.sessionRepo.findByToken(token);
    if (!session) return null;
    return this.userRepo.findById(session.userId);
  }
}
