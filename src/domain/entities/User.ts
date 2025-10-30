import type { Rol } from "../types/rolesType";
export class User {
  constructor(
    public id: string,
    public name: string,
    public last_name: string,
    public phone: number,
    public email: string,
    public role: Rol,
    public createdAt: Date = new Date()
  ) {}
}
