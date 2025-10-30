import {
  IUserRepository,
  UpdateUserProfileInput,
} from "../../domain/repositories/IUserRepository";
import { User } from "../../domain/entities/User";
import { supabaseDB } from "../../config/database";
import type { Rol } from "../../domain/types/rolesType";

interface UserRow {
  id: string;
  name: string;
  last_name: string;
  phone: number | null;
  email: string;
  role: Rol;
  created_at: string;
}

function toDomain(row: UserRow): User {
  return new User(
    row.id,
    row.name,
    row.last_name,
    Number(row.phone ?? 0),
    row.email,
    row.role,
    new Date(row.created_at)
  );
}

function buildUpdatePayload(
  patch: UpdateUserProfileInput
): Partial<Pick<UserRow, "name" | "last_name" | "phone" | "email">> {
  const payload: Partial<
    Pick<UserRow, "name" | "last_name" | "phone" | "email">
  > = {};

  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.last_name !== undefined) payload.last_name = patch.last_name;
  if (patch.phone !== undefined) payload.phone = patch.phone;
  if (patch.email !== undefined) payload.email = patch.email;

  return payload;
}

export class UsersRepository implements IUserRepository {
  async listPaged({ q = "", page = 1, limit = 20 }: { q?: string; page?: number; limit?: number }) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    let query = supabaseDB
      .from("usuarios")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (q) {
      const pattern = `%${q}%`;
      query = query.or(
        `name.ilike.${pattern},last_name.ilike.${pattern},email.ilike.${pattern}`
      );
    }
    const { data, error, count } = await query;
    if (error) throw error;
    const items = (data as UserRow[]).map(toDomain);
    return { items, total: count ?? items.length };
  }
  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabaseDB
      .from("usuarios")
      .select("*")
      .eq("email", email)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return toDomain(data as UserRow);
  }

  async findById(id: string): Promise<User | null> {
    const { data, error } = await supabaseDB
      .from("usuarios")
      .select("*")
      .eq("id", id)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return toDomain(data as UserRow);
  }

  async list(): Promise<User[]> {
    const { data, error } = await supabaseDB
      .from("usuarios")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!data?.length) return [];

    return (data as UserRow[]).map(toDomain);
  }

  async updateProfile(
    userId: string,
    patch: UpdateUserProfileInput
  ): Promise<User> {
    const payload = buildUpdatePayload(patch);

    if (!Object.keys(payload).length) {
      const current = await this.findById(userId);
      if (!current) throw new Error("Usuario no encontrado");
      return current;
    }

    const { data, error } = await supabaseDB
      .from("usuarios")
      .update(payload)
      .eq("id", userId)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Usuario no encontrado");

    return toDomain(data as UserRow);
  }

  async updateRole(targetUserId: string, role: Rol): Promise<void> {
    const { data, error } = await supabaseDB
      .from("usuarios")
      .update({ role })
      .eq("id", targetUserId)
      .select("id, role")
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("No se actualizo ningun usuario (id inexistente)");
  }

  async delete(userId: string): Promise<void> {
    const { error } = await supabaseDB
      .from("usuarios")
      .delete()
      .eq("id", userId);

    if (error) throw error;
  }
}
