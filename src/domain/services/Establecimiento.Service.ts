import crypto from "crypto";
import { AppError } from "../../core/errors/AppError";
import { Establecimiento } from "../entities/Establecimiento";
import { CreateEstablecimientoDTO } from "../dtos/establecimiento.dto";
import { IEstablecimientoRepository } from "../repositories/IEstablecimientoRepository";
import { IUserRepository } from "../repositories/IUserRepository";
import { IAuthUserRepository } from "../repositories/iAuthUserRepository";

export class EstablecimientoService {
  constructor(
    private readonly repo: IEstablecimientoRepository,
    private readonly users: IUserRepository,
    private readonly authUsers: IAuthUserRepository
  ) {}

  private normalizeRole(role: unknown) {
    return String(role ?? "")
      .toLowerCase()
      .trim();
  }

  async create(data: CreateEstablecimientoDTO) {
    const owner = await this.users.findById(data.ownerId);
    if (!owner) throw new AppError("Usuario propietario no encontrado", 404);

    // Promover a provider si a�n no lo es: primero DB, luego Auth metadata
    if (owner.role !== "provider") {
      await this.users.updateRole(owner.id, "provider");
      const updatedOwner = await this.users.findById(owner.id);
      if (!updatedOwner || updatedOwner.role !== "provider") {
        throw new AppError("No se pudo actualizar el rol del propietario", 500);
      }
      await this.authUsers.updateMetadata(owner.id, { role: "provider" });
    }

    const est = new Establecimiento(
      crypto.randomUUID(),
      data.ownerId,
      data.nombre,
      data.descripcion,
      data.direccion_calle,
      data.direccion_numero,
      data.ciudad,
      data.provincia,
      data.pais,
      data.cp,
      data.perimetro ?? null,
      data.localizacion,
      data.estado || "activo",
      data.horario_general ?? null,
      data.capacidad_teorica
    );

    return this.repo.create(est);
  }

  async getById(id: string) {
    return this.repo.findById(id);
  }

  async list() {
    return this.repo.list();
  }

  async listWithParkings() {
    return this.repo.listWithParkings();
  }

  async listByOwner(ownerId: string) {
    return this.repo.listByOwner(ownerId);
  }

  async update(
    id: string,
    partial: Partial<Establecimiento>
  ): Promise<Establecimiento> {
    return this.repo.update(id, partial);
  }

  async delete(id: string, requester?: { id: string; role?: string | null }) {
    const est = await this.repo.findById(id);
    console.log("find#Est", est);
    if (est === null) throw new AppError("Establecimiento no encontrado", 404);

    if (requester) {
      const role = this.normalizeRole(requester.role);
      const isAdmin = role === "admin" || role === "superadmin" || role === "1";
      const isOwner =
        role === "provider" && est.propietario_id === requester.id;
      if (!isAdmin && !isOwner) {
        throw new AppError(
          "No autorizado para eliminar este establecimiento",
          403
        );
      }
    }

    console.log("llegue");
    await this.repo.delete(id);
  }
}
