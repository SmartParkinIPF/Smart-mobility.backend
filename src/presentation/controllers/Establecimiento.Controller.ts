import { Request, Response, NextFunction } from "express";
import { EstablecimientoService } from "../../domain/services/Establecimiento.Service";
import { EstacionamientoSupabaseRepository } from "../../infra/repositories/EstacionamientoRepository";
import { SlotsSupabaseRepository } from "../../infra/repositories/SlotsRepository";
import {
  createEstablecimientoSchema,
  updateEstablecimientoSchema,
} from "../../infra/validators/establecimiento.validator";
import { AppError } from "../../core/errors/AppError";

type LatLngLiteral = { lat: number; lng: number };
type PublicMarker = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  coordinates: LatLngLiteral;
  pinColor: string;
  createdAt: string | null;
};

const parseLocation = (raw: any): LatLngLiteral | null => {
  if (!raw) return null;

  const tryFromPair = (lat: any, lng: any): LatLngLiteral | null => {
    const toNumber = (value: any) =>
      typeof value === "number" ? value : value != null ? Number(value) : NaN;
    const latNum = toNumber(lat);
    const lngNum = toNumber(lng);
    if (Number.isFinite(latNum) && Number.isFinite(lngNum)) {
      return { lat: latNum, lng: lngNum };
    }
    return null;
  };

  if (typeof raw === "object" && !Array.isArray(raw)) {
    const basic = tryFromPair(
      (raw as any).lat ?? (raw as any).latitude ?? (raw as any).y,
      (raw as any).lng ?? (raw as any).longitude ?? (raw as any).x
    );
    if (basic) return basic;

    if (
      raw.type &&
      typeof raw.type === "string" &&
      Array.isArray((raw as any).coordinates)
    ) {
      const coords = (raw as any).coordinates;
      if (coords.length >= 2) {
        const fromGeoJson = tryFromPair(coords[1], coords[0]);
        if (fromGeoJson) return fromGeoJson;
      }
    }
  }

  if (Array.isArray(raw) && raw.length >= 2) {
    const arr = tryFromPair(raw[1], raw[0]);
    if (arr) return arr;
  }

  if (typeof raw === "string") {
    const pointMatch = raw.match(/POINT\s*\(\s*([\-0-9\.]+)\s+([\-0-9\.]+)\s*\)/i);
    if (pointMatch) {
      const lng = Number(pointMatch[1]);
      const lat = Number(pointMatch[2]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng };
      }
    }
  }

  return null;
};

export class EstablecimientoController {
  constructor(private readonly service: EstablecimientoService) {}

  listPublicLocations = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const items = await this.service.list();
      const markers = items.reduce<PublicMarker[]>((acc, est) => {
        const coordinates = parseLocation(est.localizacion);
        if (!coordinates) return acc;
        acc.push({
          id: est.id,
          title: est.nombre,
          description: est.descripcion ?? null,
          category: est.estado === "activo" ? "available" : "unavailable",
          coordinates,
          pinColor: est.estado === "activo" ? "green" : "gray",
          createdAt: est.created_at?.toISOString?.() ?? null,
        });
        return acc;
      }, []);
      res.json({ markers });
    } catch (err) {
      next(err);
    }
  };

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
      console.log(item);
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
