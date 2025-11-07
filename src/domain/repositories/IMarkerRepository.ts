import { MapMarker } from "../entities/MapMarker";

export interface IMapMarkerRepository {
  create(marker: MapMarker): Promise<MapMarker>;
  findAll(): Promise<MapMarker[]>;
  existsByLatLon(latitude: number, longitude: number): Promise<boolean>;
}
