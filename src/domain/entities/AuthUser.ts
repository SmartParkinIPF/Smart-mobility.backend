import type { Rol } from "../types/rolesType";
export class AuthUser {
  constructor(
    public email: string,
    public password: string,
    public metadata: {
      role: Rol;
      name: string;
      last_name: string;
      phone: number;
    } & Record<string, unknown>,
    public email_confirm: boolean,
    public create_at: Date = new Date()
  ) {}
}
