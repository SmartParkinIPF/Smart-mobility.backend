import { LatLng, GeoPolygon } from "../../domain/types/coordsType";

export type CreateEstablecimientoDTO = {
  ownerId: string; // propietario_id
  nombre: string;
  descripcion: string;
  direccion_calle: string;
  direccion_numero: string;
  ciudad: string;
  provincia: string;
  pais: string;
  cp: string;
  perimetro?: GeoPolygon;
  localizacion: LatLng;
  estado?: string; // opcional, por defecto 'activo'
  horario_general?: unknown; // estructura libre (jsonb)
  capacidad_teorica: number;
};
