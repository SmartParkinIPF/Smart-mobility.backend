import { GeoPolygon } from "../types/coordsType";

export class Slots {
  constructor(
    public id: string,
    public estacionamiento_id: string,
    public codigo: string,
    public tipo: string,
    public ancho_cm: number,
    public largo_cm: number,
    public ubicacion_local: GeoPolygon,
    public estado_operativo: string,
    public tarifa_id: string,
    public es_reservable: boolean,
    public created_at: Date = new Date(),
    public updated_at: Date = new Date()
  ) {}
}
