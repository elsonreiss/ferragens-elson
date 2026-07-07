export type UserRole = "admin" | "gerente" | "funcionario";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  photoUrl: string | null;
  createdAt: string;
}

export interface UserWithHash extends User {
  passwordHash: string;
}

export interface NewUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  photoUrl?: string | null;
}

export interface Session {
  token: string;
  userId: number;
  expiresAt: string;
}
