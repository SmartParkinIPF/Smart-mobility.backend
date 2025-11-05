import { Request, Response, NextFunction } from "express";
import { EstablecimientoService } from "../../domain/services/Establecimiento.Service";
import { EstacionamientoSupabaseRepository } from "../../infra/repositories/EstacionamientoRepository";
import { SlotsSupabaseRepository } from "../../infra/repositories/SlotsRepository";
import {
  createEstablecimientoSchema,
  updateEstablecimientoSchema,
} from "../../infra/validators/establecimiento.validator";
import { AppError } from "../../core/errors/AppError";

export class EstablecimientoController {
  constructor(private readonly service: EstablecimientoService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createEstablecimientoSchema.parse(req.body);
      const created = await this.service.create(parsed);
      res.status(201).json(created);
    } catch (err) {
      if ((err as any)?.issues)
        return next(
          new AppError("Validacion fallida", 400, (err as any).issues)
        );
      next(err);
    }
  };

  list = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await this.service.list();
      res.json(items);
    } catch (err) {
      next(err);
    }
  };

  listMine = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = (req as any).authUser;
      if (!auth?.id) return res.status(401).json({ message: "No autorizado" });
      const items = await this.service.listByOwner(auth.id);
      res.json(items);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const item = await this.service.getById(id);
      if (!item) return res.status(404).json({ message: "No encontrado" });
      res.json(item);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const parsed = updateEstablecimientoSchema.parse(req.body);
      const item = await this.service.update(id, parsed as any);
      res.json(item);
    } catch (err) {
      if ((err as any)?.issues)
        return next(
          new AppError("Validacion fallida", 400, (err as any).issues)
        );
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      await this.service.delete(id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  getGeometry = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const est = await this.service.getById(id);
      if (!est) return res.status(404).json({ message: "No encontrado" });
      console.log(est);
      // Repositorios para estacionamientos y slots
      const parkRepo = new EstacionamientoSupabaseRepository();
      const slotRepo = new SlotsSupabaseRepository();

      const parks = await parkRepo.listByEstablecimiento(est.id);
      console.log(parks);
      const estacionamientos = [] as any[];
      for (const p of parks) {
        const slots = await slotRepo.listByEstacionamiento(p.id);
        estacionamientos.push({
          id: p.id,
          nombre: p.nombre,
          ubicacion: p.ubicacion,
          perimetro_est: p.perimetro_est ?? null,
          slots: slots.map((s) => ({
            id: s.id,
            estacionamiento_id: s.estacionamiento_id,
            ubicacion_local: s.ubicacion_local,
            tipo: s.tipo,
            codigo: s.codigo,
            ancho_cm: s.ancho_cm,
            largo_cm: s.largo_cm,
            estado_operativo: s.estado_operativo,
          })),
        });
      }

      const response = {
        perimetro: (est as any).perimetro ?? null,
        estacionamientos,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  };
}
