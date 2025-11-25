import { LatLng, GeoPolygon } from "../types/coordsType";
export class Estacionamiento {
  constructor(
    public id: string,
    public establecimiento_id: string,
    public nombre: string,
    public tipo: string,
    public soporta_discapacidad: boolean,
    public soporta_motos: boolean,
    public soporta_electricos: boolean,
    public tiene_cargadores: boolean,
    public cantidad_cargadores: number,
    public tarifa_id: string,
    public horario_id: string,
    public politica_cancelacion_id: string,
    public estado: string,
    public ubicacion: LatLng,
    public perimetro_est: GeoPolygon | null,
    public created_at: Date = new Date(),
    public updated_at: Date = new Date()
  ) {}
}
