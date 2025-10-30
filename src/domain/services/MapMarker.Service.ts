import { IMapMarkerRepository } from "../repositories/IMarkerRepository";
import { CreateMarkerDTO } from "../dtos/mapMarker.dto";
import { MapMarker } from "../entities/MapMarker";
import { AppError } from "../../core/errors/AppError";
import crypto from "crypto";

export class MapMarkerService {
  constructor(private readonly markers: IMapMarkerRepository) {}

  async list() {
    return this.markers.findAll();
  }

  async create(data: CreateMarkerDTO) {
    // Reglas de negocio: no duplicar par (lat, lon)
    for (const c of data.coordinates) {
      const dup = await this.markers.existsByLatLon(c.latitude, c.longitude);
      if (dup)
        throw new AppError("Ya existe un marcador en esas coordenadas", 409, c);
    }

    const marker = new MapMarker(
      crypto.randomUUID(),
      data.title,
      data.description,
      data.category,
      data.coordinates,
      data.pinColor || "green"
    );
    return this.markers.create(marker);
  }
}
