import { AppError } from "../../core/errors/AppError";
import { AuthUser } from "../entities/AuthUser";
import { Establecimiento } from "../entities/Establecimiento";
import { User } from "../entities/User";
import { IAuthUserRepository } from "../repositories/iAuthUserRepository";
import { IEstablecimientoRepository } from "../repositories/IEstablecimientoRepository";
import {
  IUserRepository,
  UpdateUserProfileInput,
} from "../repositories/IUserRepository";

const USER_SYNC_MAX_RETRIES = 5;
const USER_SYNC_INTERVAL_MS = 200;

export class EncargadoService {
  constructor(
    private readonly users: IUserRepository,
    private readonly authUsers: IAuthUserRepository,
    private readonly establecimientos: IEstablecimientoRepository
  ) {}

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

  private async assertProviderOwnership(
    providerId: string,
    establecimientoId: string
  ): Promise<Establecimiento> {
    const provider = await this.users.findById(providerId);
    if (!provider || provider.role !== "provider") {
      throw new AppError("Solo un provider puede realizar esta accion", 403);
    }
    const est = await this.establecimientos.findById(establecimientoId);
    if (!est) throw new AppError("Establecimiento no encontrado", 404);
    if (est.propietario_id !== providerId) {
      throw new AppError(
        "No puedes gestionar encargados de un establecimiento que no es tuyo",
        403
      );
    }
    return est;
  }

  async createOrAssignEncargado(
    providerId: string,
    establecimientoId: string,
    input:
      | { existingUserId: string }
      | {
          name: string;
          lastName: string;
          phone: number;
          email: string;
          password: string;
        }
  ): Promise<{ encargado: User; establecimiento: Establecimiento }> {
    const est = await this.assertProviderOwnership(
      providerId,
      establecimientoId
    );

    const currentEncargado = await this.users.findEncargadoByEstablecimiento(
      establecimientoId
    );
    if (currentEncargado) {
      throw new AppError(
        "El establecimiento ya tiene un encargado asignado",
        409
      );
    }

    let user: User | null = null;

    if ("existingUserId" in input) {
      user = await this.users.findById(input.existingUserId);
      if (!user) throw new AppError("Usuario existente no encontrado", 404);
      if (user.role === "admin" || user.role === "provider") {
        throw new AppError(
          "No se puede asignar como encargado a un admin o provider",
          400
        );
      }
      if (
        user.role === "encargado" &&
        user.establecimiento_id &&
        user.establecimiento_id !== establecimientoId
      ) {
        throw new AppError(
          "El usuario ya es encargado de otro establecimiento",
          409
        );
      }
    } else {
      const normalizedEmail = input.email.toLowerCase();
      const exists = await this.authUsers.findByEmail(normalizedEmail);
      if (exists) throw new AppError("Email ya registrado", 409);
      const authUser = new AuthUser(
        normalizedEmail,
        input.password,
        {
          role: "encargado",
          name: input.name,
          last_name: input.lastName,
          phone: input.phone,
        },
        true
      );
      const createdId = await this.authUsers.create(authUser);
      const synced = await this.waitForUser(createdId);
      if (!synced)
        throw new Error("Usuario no sincronizado con la base de datos");
      user = synced;
    }

    await this.users.updateRoleAndEstablecimiento(
      user.id,
      "encargado",
      establecimientoId
    );
    const updated = await this.users.findById(user.id);
    const finalUser = updated ?? user;

    await this.authUsers.updateMetadata(user.id, {
      role: "encargado",
      establecimiento_id: establecimientoId,
      name: finalUser.name,
      last_name: finalUser.last_name,
      phone: finalUser.phone,
    });

    return { encargado: finalUser, establecimiento: est };
  }

  async getEncargado(
    requesterId: string,
    establecimientoId: string
  ): Promise<User | null> {
    const est = await this.establecimientos.findById(establecimientoId);
    if (!est) throw new AppError("Establecimiento no encontrado", 404);
    const requester = await this.users.findById(requesterId);
    if (!requester) throw new AppError("No autenticado", 401);
    const encargado = await this.users.findEncargadoByEstablecimiento(
      establecimientoId
    );
    if (!encargado) return null;

    const isOwner =
      requester.role === "provider" && est.propietario_id === requesterId;
    const isSelf =
      requester.role === "encargado" && requester.id === encargado.id;
    if (!isOwner && !isSelf) {
      throw new AppError("No autorizado", 403);
    }

    return encargado;
  }

  async updateEncargado(
    providerId: string,
    encargadoId: string,
    patch: UpdateUserProfileInput
  ): Promise<User> {
    const encargado = await this.users.findById(encargadoId);
    if (!encargado || encargado.role !== "encargado") {
      throw new AppError("Encargado no encontrado", 404);
    }
    if (!encargado.establecimiento_id) {
      throw new AppError(
        "El encargado no esta asociado a ningun establecimiento",
        400
      );
    }
    await this.assertProviderOwnership(
      providerId,
      encargado.establecimiento_id
    );

    const updated = await this.users.updateProfile(encargadoId, patch);
    await this.authUsers.updateMetadata(encargadoId, {
      role: updated.role,
      name: updated.name,
      last_name: updated.last_name,
      phone: updated.phone,
    });
    return updated;
  }

  async removeEncargado(
    providerId: string,
    establecimientoId: string
  ): Promise<void> {
    await this.assertProviderOwnership(providerId, establecimientoId);
    const encargado = await this.users.findEncargadoByEstablecimiento(
      establecimientoId
    );
    if (!encargado) {
      throw new AppError("El establecimiento no tiene encargado", 404);
    }

    // Al desasignar, lo degradamos a rol "user" y limpiamos la relacion.
    await this.users.updateRoleAndEstablecimiento(
      encargado.id,
      "user",
      null
    );
    await this.authUsers.updateMetadata(encargado.id, {
      role: "user",
      establecimiento_id: null,
      name: encargado.name,
      last_name: encargado.last_name,
      phone: encargado.phone,
    });
  }
}
