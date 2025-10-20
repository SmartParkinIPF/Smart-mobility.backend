import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import { supabaseDB, supabaseServiceRol } from "../../config/database";
import {
  AuthUserProfile,
  IAuthUserRepository,
} from "../../domain/repositories/iAuthUserRepository";
import { AuthUser } from "../../domain/entities/AuthUser";
import { User } from "../../domain/entities/User";

function toProfile(user: SupabaseAuthUser): AuthUserProfile {
  if (!user.email) throw new Error("Usuario sin email en Supabase");

  const metadataRole = (user.user_metadata?.role ?? user.user_metadata?.rol) as
    | string
    | undefined;

  const confirmedAt = user.email_confirmed_at ?? user.confirmed_at;

  return {
    id: user.id,
    email: user.email,
    role: metadataRole,
    emailConfirmed: Boolean(confirmedAt),
    createdAt: new Date(user.created_at),
  };
}

export class AuthUserRepository implements IAuthUserRepository {
  async create(authUser: AuthUser): Promise<User["id"]> {
    const { data, error } = await supabaseServiceRol.auth.admin.createUser({
      email: authUser.email,
      password: authUser.password,
      email_confirm: authUser.email_confirm,
      user_metadata: authUser.metadata,
    });

    if (error) throw error;

    const created = data.user?.id;
    if (!created) throw new Error("No se recibio el id del usuario creado");

    return created;
  }

  async signIn(email: string, password: string): Promise<string> {
    const normalized = email.toLowerCase();
    const {
      data: { user, session },
      error,
    } = await supabaseDB.auth.signInWithPassword({
      email: normalized,
      password,
    });

    if (error || !user || !session)
      throw error ?? new Error("Credenciales invalidas");

    return user.id;
  }

  async findByEmail(email: string): Promise<AuthUserProfile | null> {
    const normalized = email.toLowerCase();
    const { data, error } = await supabaseServiceRol.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    });

    if (error) throw error;

    const users = data?.users ?? [];
    const user = users.find((u) => u.email?.toLowerCase() === normalized);
    if (!user) return null;

    return toProfile(user);
  }
  async findById(id: string): Promise<AuthUserProfile | null> {
    const { data, error } = await supabaseServiceRol.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    });

    if (error) throw error;

    const users = data?.users ?? [];
    const user = users.find((u) => u.id.toLowerCase() === id);
    if (!user) return null;

    return toProfile(user);
  }

  async delete(userId: string): Promise<void> {
    const { error } = await supabaseServiceRol.auth.admin.deleteUser(userId);

    if (error) throw error;
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const { error } = await supabaseServiceRol.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (error) throw error;
  }

  async updateMetadata(
    userId: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    const { error } = await supabaseServiceRol.auth.admin.updateUserById(
      userId,
      { user_metadata: metadata }
    );

    if (error) throw error;
  }
}
