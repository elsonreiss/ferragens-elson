import { UserRepository, SessionRepository, LoginAttemptRepository } from "@/domain/repositories";
import { verifyPassword } from "@/lib/auth";

// Após MAX_FAILED_ATTEMPTS falhas de login com o mesmo e-mail dentro da
// janela de LOCKOUT_WINDOW_MINUTES, novas tentativas são bloqueadas — mesmo
// com a senha correta — até a janela expirar. Protege contra força bruta.
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MINUTES = 15;

export class AuthUseCases {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly sessionRepo: SessionRepository,
    private readonly loginAttemptRepo: LoginAttemptRepository
  ) {}

  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const recentFailures = await this.loginAttemptRepo.countRecentFailures(normalizedEmail, LOCKOUT_WINDOW_MINUTES);
    if (recentFailures >= MAX_FAILED_ATTEMPTS) {
      throw new Error(
        `Muitas tentativas de login com este e-mail. Aguarde ${LOCKOUT_WINDOW_MINUTES} minutos e tente novamente.`
      );
    }

    const user = await this.userRepo.findByEmailWithHash(normalizedEmail);
    const valid = Boolean(user) && user!.active && verifyPassword(password, user!.passwordHash);

    await this.loginAttemptRepo.record(normalizedEmail, valid);

    if (!valid) throw new Error("E-mail ou senha inválidos.");

    const session = await this.sessionRepo.create(user!.id);
    const { passwordHash: _passwordHash, ...safeUser } = user!;
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
