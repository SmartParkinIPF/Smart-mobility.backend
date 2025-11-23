import { GeoPolygon } from "../types/coordsType";

export type CreateSlotDTO = {
  estacionamiento_id: string;
  codigo: string;
  tipo: string;
  ancho_cm: number;
  largo_cm: number;
  ubicacion_local: GeoPolygon; // jsonb en DB
  estado_operativo: string;
  tarifa_id: string;
  es_reservable: boolean;
};

