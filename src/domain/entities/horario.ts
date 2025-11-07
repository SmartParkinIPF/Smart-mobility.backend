export class Horario {
  constructor(
    public id: string,
    public id_usuario: string,
    public tipo: string,
    public definicion: string,
    public created_at: Date = new Date(),
    public updated_at: Date = new Date()
  ) {}
}
