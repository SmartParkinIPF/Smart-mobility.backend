import { LatLng, GeoPolygon } from "../types/coordsType";
export class Establecimiento {
  constructor(
    public id: string,
    public propietario_id: string,
    public nombre: string,
    public descripcion: string,
    public direccion_calle: string,
    public direccion_numero: string,
    public ciudad: string,
    public provincia: string,
    public pais: string,
    public cp: string,
    public perimetro: GeoPolygon | null,
    public localizacion: LatLng,
    public estado: string,
    public horario_general: unknown,
    public capacidad_teorica: number,
    public created_at: Date = new Date(),
    public updated_at: Date = new Date()
  ) {}
}
