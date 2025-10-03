import { User } from "../entities/User";
import type { Rol } from "../types/rolesType";

export type UpdateUserProfileInput = Partial<
  Pick<User, "name" | "last_name" | "phone" | "email">
>;

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  list(): Promise<User[]>;
  updateProfile(userId: string, patch: UpdateUserProfileInput): Promise<User>;
  updateRole(targetUserId: string, role: Rol): Promise<void>;
  delete(userId: string): Promise<void>;
}
