import { supabaseServiceRol } from "../../config/database";
import { Notificacion } from "../../domain/entities/Notificacion";
import {
  CreateNotificacionInput,
  INotificacionRepository,
} from "../../domain/repositories/INotificacionRepository";

type NotifRow = {
  id: string;
  user_id: string;
  titulo: string;
  mensaje: string;
  estado: string;
  created_at: string;
};

const toDomain = (r: NotifRow): Notificacion =>
  new Notificacion(r.id, r.user_id, r.titulo, r.mensaje, r.estado, new Date(r.created_at));

export class NotificacionSupabaseRepository implements INotificacionRepository {
  async create(input: CreateNotificacionInput): Promise<Notificacion> {
    const { data, error } = await supabaseServiceRol
      .from("alerta_mobile")
      .insert({
        user_id: input.user_id,
        titulo: input.titulo,
        mensaje: input.mensaje,
        estado: input.estado ?? "nueva",
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();
    if (error) throw error;
    return toDomain(data as NotifRow);
  }

  async listByUser(userId: string, limit = 20): Promise<Notificacion[]> {
    const { data, error } = await supabaseServiceRol
      .from("alerta_mobile")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return ((data as NotifRow[]) ?? []).map(toDomain);
  }

  async markLeida(id: string): Promise<Notificacion> {
    const { data, error } = await supabaseServiceRol
      .from("alerta_mobile")
      .update({ estado: "leida" })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return toDomain(data as NotifRow);
  }
}
