import type { Rol } from "../types/rolesType";
import { IUserRepository } from "../repositories/IUserRepository";
import { IAuthUserRepository } from "../repositories/iAuthUserRepository";
import { AppError } from "../../core/errors/AppError";
import { User } from "../entities/User";

export class RoleService {
  constructor(
    private readonly users: IUserRepository,
    private readonly authUsers: IAuthUserRepository
  ) {}

  async assignRole(
    currentUserId: string,
    targetUserId: string,
    newRole: Rol
  ): Promise<User> {
    const current = await this.users.findById(currentUserId);

    if (!current) throw new AppError("Usuario autenticado no encontrado", 404);
    if (current.role !== "admin")
      throw new AppError("No estas autorizado para hacer esta accion", 403);
    if (currentUserId === targetUserId)
      throw new AppError("No podes cambiar tu propio rol", 400);

    const target = await this.users.findById(targetUserId);
    if (!target) throw new AppError("Usuario objetivo no encontrado", 404);
    if (target.role === newRole) return target;

    await this.users.updateRole(targetUserId, newRole);

    const updated = await this.users.findById(targetUserId);
    if (!updated)
      throw new AppError("Fallo la actualizacion de rol del usuario", 500);

    await this.authUsers.updateMetadata(targetUserId, {
      role: updated.role,
      name: updated.name,
      last_name: updated.last_name,
      phone: updated.phone,
    });

    return updated;
  }
}
