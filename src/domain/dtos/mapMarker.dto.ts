import { Coordinate } from "../entities/MapMarker";
export type CreateMarkerDTO = {
  title: string;
  description: string;
  category: string;
  coordinates: Coordinate[];
  pinColor?: string;
};
