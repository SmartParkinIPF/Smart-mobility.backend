import { LatLng, GeoPolygon } from "../../domain/types/coordsType";

export type CreateEstacionamientoDTO = {
  establecimiento_id: string;
  nombre: string;
  tipo: string;
  soporta_discapacidad: boolean;
  soporta_motos: boolean;
  soporta_electricos: boolean;
  tiene_cargadores: boolean;
  cantidad_cargadores: number;
  tarifa_id: string;
  horario_id: string;
  politica_cancelacion_id: string;
  estado?: string;
  ubicacion: LatLng;
  perimetro_est: GeoPolygon;
};

