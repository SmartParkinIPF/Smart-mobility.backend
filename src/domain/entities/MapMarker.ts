export type Coordinate = { latitude: number; longitude: number };

export class MapMarker {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public category: string,
    public coordinates: Coordinate[],
    public pinColor: string = "green",
    public createdAt: Date = new Date()
  ) {}
}
