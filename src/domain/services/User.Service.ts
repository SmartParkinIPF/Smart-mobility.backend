import {
  IUserRepository,
  UpdateUserProfileInput,
} from "../repositories/IUserRepository";
import { RegisterDTO, LoginDTO, UpdateUserDTO } from "../dtos/user.dto";
import { AppError } from "../../core/errors/AppError";
import jwt from "jsonwebtoken";
import { ENV } from "../../config/env";
import { IAuthUserRepository } from "../repositories/iAuthUserRepository";
import { AuthUser } from "../entities/AuthUser";
import { User } from "../entities/User";
import type { Rol } from "../types/rolesType";
import { JwtValidator } from "../../presentation/routes/auth.routes";

const USER_SYNC_MAX_RETRIES = 5;
const USER_SYNC_INTERVAL_MS = 200;

export class UserService {
  constructor(
    private readonly users: IUserRepository,
    private readonly authUsers: IAuthUserRepository
  ) {}

  async register(data: RegisterDTO) {
    const normalizedEmail = data.email.toLowerCase();
    const desiredRole = (data.role ?? "user") as Rol;

    if (desiredRole === "admin")
      throw new AppError(
        "No podes registrarte como administrador. Solicita el cambio a un admin existente.",
        403
      );

    const exists = await this.authUsers.findByEmail(normalizedEmail);
    if (exists) throw new AppError("Email ya registrado", 409);

    const authUser = new AuthUser(
      normalizedEmail,
      data.password,
      {
        role: desiredRole,
        name: data.name,
        last_name: data.lastName,
        phone: data.phone,
      },
      true
    );

    const createdId = await this.authUsers.create(authUser);

    const synced = await this.waitForUser(createdId);
    if (!synced)
      throw new Error("Usuario no sincronizado con la base de datos");

    let finalUser = synced;
    if (synced.role !== desiredRole) {
      await this.users.updateRole(synced.id, desiredRole);
      finalUser = (await this.users.findById(synced.id)) ?? synced;
    }

    return { user: this.toPublic(finalUser) };
  }

  async login(data: LoginDTO) {
    const normalizedEmail = data.email.toLowerCase();
    const user1 = await this.users.findByEmail(normalizedEmail);
    if (!user1) throw new AppError("No existe este email", 401);

    console.log(data);
    const user = await this.authUsers.signIn(normalizedEmail, data.password);

    const token = await JwtValidator.createJwt(user);

    console.log(user1);
    // console.log({ session });
    return { user: this.toPublic(user1), token };
  }

  async updateProfile(
    requesterId: string,
    targetUserId: string,
    data: UpdateUserDTO
  ) {
    const requester = await this.users.findById(requesterId);
    if (!requester)
      throw new AppError("Usuario autenticado no encontrado", 404);

    if (requester.id !== targetUserId && requester.role !== "admin")
      throw new AppError(
        "No estas autorizado para actualizar este usuario",
        403
      );

    const target = await this.users.findById(targetUserId);
    if (!target) throw new AppError("Usuario objetivo no encontrado", 404);

    const patch: UpdateUserProfileInput = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.lastName !== undefined) patch.last_name = data.lastName;
    if (data.phone !== undefined) patch.phone = data.phone;

    if (!Object.keys(patch).length)
      throw new AppError("Debes enviar al menos un campo para actualizar", 400);

    const updated = await this.users.updateProfile(targetUserId, patch);

    await this.authUsers.updateMetadata(targetUserId, {
      role: updated.role,
      name: updated.name,
      last_name: updated.last_name,
      phone: updated.phone,
    });

    return this.toPublic(updated);
  }

  async deleteAccount(requesterId: string, targetUserId: string) {
    const requester = await this.users.findById(requesterId);
    if (!requester)
      throw new AppError("Usuario autenticado no encontrado", 404);

    if (requester.id !== targetUserId && requester.role !== "admin")
      throw new AppError("No estas autorizado para eliminar este usuario", 403);

    const target = await this.users.findById(targetUserId);
    if (!target) throw new AppError("Usuario objetivo no encontrado", 404);

    await this.authUsers.delete(targetUserId);
    await this.users.delete(targetUserId);
  }

  async getProfile(requesterId: string, targetUserId?: string) {
    const requester = await this.users.findById(requesterId);
    if (!requester)
      throw new AppError("Usuario autenticado no encontrado", 404);

    const targetId = !targetUserId || targetUserId === requesterId ? requesterId : targetUserId;

    if (targetId !== requesterId && requester.role !== "admin") {
      throw new AppError("No estas autorizado para ver este usuario", 403);
    }

    const target = await this.users.findById(targetId);
    if (!target) throw new AppError("Usuario objetivo no encontrado", 404);

    return this.toPublic(target);
  }

  private async waitForUser(userId: string): Promise<User | null> {
    for (let attempt = 0; attempt < USER_SYNC_MAX_RETRIES; attempt++) {
      const user = await this.users.findById(userId);
      if (user) return user;
      await new Promise((resolve) =>
        setTimeout(resolve, USER_SYNC_INTERVAL_MS)
      );
    }
    return null;
  }

  private signJWT(userId: string) {
    return jwt.sign({ sub: userId }, ENV.JWT_SECRET, { expiresIn: "1h" });
  }

  private toPublic(u: User) {
    const { ...rest } = u;
    console.log(rest);
    return rest;
  }
}
