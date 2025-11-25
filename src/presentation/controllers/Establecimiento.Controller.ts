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
  tipo?: string | null;
  coordinates: LatLngLiteral;
  pinColor: string;
  createdAt: string | null;
  perimetro?: unknown;
};

const toSearchableText = (value: unknown) =>
  typeof value === "string" ? value.toLowerCase() : "";

const normalizeSearch = (query: unknown) =>
  typeof query === "string" ? query.trim().toLowerCase() : "";

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
    const pointMatch = raw.match(
      /POINT\s*\(\s*([\-0-9\.]+)\s+([\-0-9\.]+)\s*\)/i
    );
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

const deriveCategory = (
  estado: unknown
): { category: string; pinColor: string } => {
  const normalized = (estado ?? "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (!normalized) {
    return { category: "unavailable", pinColor: "gray" };
  }

  // Categor�a pedida: libre vs estacionable (fallback al esquema anterior)
  if (normalized.includes("libre") || normalized === "available") {
    return { category: "libre", pinColor: "green" };
  }
  if (normalized.includes("estacionable")) {
    return { category: "estacionable", pinColor: "#2563eb" };
  }
  if (normalized.includes("inactivo") || normalized.includes("inactive")) {
    return { category: "unavailable", pinColor: "gray" };
  }
  if (normalized.includes("activo")) {
    return { category: "available", pinColor: "green" };
  }

  // Cualquier otro estado se expone tal cual pero con color neutro
  return { category: normalized, pinColor: "#6b7280" };
};

const deriveTipoFromParkings = (parkings: any[]): string | null => {
  if (!Array.isArray(parkings) || !parkings.length) return null;
  const normalize = (val: any) =>
    (val ?? "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  const tipos = new Set(
    parkings
      .map((p) => normalize((p as any)?.tipo))
      .filter(Boolean) as string[]
  );
  if (tipos.has("mixto")) return "mixto";
  if (tipos.size > 1) return "mixto";
  const [only] = Array.from(tipos);
  return only || null;
};

export class EstablecimientoController {
  private readonly parkRepo = new EstacionamientoSupabaseRepository();
  private readonly slotRepo = new SlotsSupabaseRepository();

  constructor(private readonly service: EstablecimientoService) {}

  private async buildGeometryPayload(est: any) {
    const parks = await this.parkRepo.listByEstablecimiento(est.id);
    const estacionamientos = await Promise.all(
      parks.map(async (p) => {
        const slots = await this.slotRepo.listByEstacionamiento(p.id);
        return {
          id: p.id,
          nombre: p.nombre,
          ubicacion: p.ubicacion,
          perimetro_est: (p as any).perimetro_est ?? null,
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
        };
      })
    );
    return {
      perimetro: (est as any).perimetro ?? null,
      estacionamientos,
    };
  }

  listPublicLocations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const search = normalizeSearch(req.query.q ?? req.query.search);
      const itemsWithParks = await this.service.listWithParkings();
      const items = itemsWithParks.map((it) => it.est);
      const filtered = search
        ? items.filter((est) => {
            const haystack = [
              est.nombre,
              est.descripcion,
              `${est.direccion_calle ?? ""} ${
                est.direccion_numero ?? ""
              }`.trim(),
              est.ciudad,
              est.provincia,
              est.pais,
            ]
              .map(toSearchableText)
              .filter(Boolean);
            return haystack.some((text) => text.includes(search));
          })
        : items;
      const parksByEstId = new Map(
        itemsWithParks.map((it) => [it.est.id, it.parkings])
      );
      const markers = filtered.reduce<PublicMarker[]>((acc, est) => {
        const coordinates = parseLocation(est.localizacion);
        if (!coordinates) return acc;
        const { category, pinColor } = deriveCategory(est.estado);
        const parks = parksByEstId.get(est.id) ?? [];
        const tipo = deriveTipoFromParkings(parks);
        acc.push({
          id: est.id,
          title: est.nombre,
          description: est.descripcion ?? null,
          category,
          tipo,
          coordinates,
          pinColor,
          createdAt: est.created_at?.toISOString?.() ?? null,
          perimetro:
            (est as any).perimetro ??
            (est as any).perimetro_est ??
            (est as any).perimeter ??
            null,
        });
        return acc;
      }, []);
      res.json({ markers, total: filtered.length });
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
      const response = await this.buildGeometryPayload(est);
      res.json(response);
    } catch (err) {
      next(err);
    }
  };

  getPublicGeometry = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const id = req.params.id;
      const est = await this.service.getById(id);
      if (!est) return res.status(404).json({ message: "No encontrado" });
      const response = await this.buildGeometryPayload(est);
      res.json(response);
    } catch (err) {
      next(err);
    }
  };
}
