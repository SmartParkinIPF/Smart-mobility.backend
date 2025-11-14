import { Router } from "express";
import { EstablecimientoController } from "../controllers/Establecimiento.Controller";
import { EstablecimientoService } from "../../domain/services/Establecimiento.Service";
import { EstablecimientoSupabaseRepository } from "../../infra/repositories/EstablecimientoRepository";
import { UsersRepository } from "../../infra/repositories/UserRepository";
import { AuthUserRepository } from "../../infra/repositories/AuthUserRepository";
import { ValidatorJwt } from "../../core/middleware/validateJwt";
import { EstacionamientoSupabaseRepository } from "../../infra/repositories/EstacionamientoRepository";
import { supabaseDB } from "../../config/database";

const JwtValidator = new ValidatorJwt();

const router = Router();
const controller = new EstablecimientoController(
  new EstablecimientoService(
    new EstablecimientoSupabaseRepository(),
    new UsersRepository(),
    new AuthUserRepository()
  )
);

router.post("/", JwtValidator.validateJwt, controller.create);
router.get("/", JwtValidator.validateJwt, controller.list);
router.get("/mine", JwtValidator.validateJwt, controller.listMine);

// Resumen + listado de slots por establecimiento (agregado para mobile)
router.get(
  "/:id/slots",
  JwtValidator.validateJwt,
  async (req, res, next) => {
    try {
      const establecimientoId = req.params.id;
      const parksRepo = new EstacionamientoSupabaseRepository();
      const parks = await parksRepo.listByEstablecimiento(establecimientoId);
      if (!parks.length) {
        return res.json({ total: 0, ocupados: 0, libres: 0, slots: [] });
      }
      const parkIds = parks.map((p) => p.id);

      // Traer todos los slots de estos estacionamientos en un solo query
      const { data: slotsData, error: slotsErr } = await supabaseDB
        .from("slots")
        .select("id, estacionamiento_id, codigo, tipo, estado_operativo")
        .in("estacionamiento_id", parkIds);
      if (slotsErr) throw slotsErr;
      const slots = (slotsData as any[]) || [];
      if (!slots.length) {
        return res.json({ total: 0, ocupados: 0, libres: 0, slots: [] });
      }

      // Consultar reservas activas para estos slots en el momento actual
      const nowIso = new Date().toISOString();
      const { data: reservasData, error: resErr } = await supabaseDB
        .from("reservas")
        .select("slot_id, desde, hasta, estado")
        .in("slot_id", slots.map((s) => s.id))
        .neq("estado", "cancelada")
        .lte("desde", nowIso)
        .gte("hasta", nowIso);
      if (resErr) throw resErr;
      const reservas = (reservasData as any[]) || [];
      const occSet = new Set(
        reservas.map((r: any) => r.slot_id).filter(Boolean)
      );

      // Combinar estado_operativo (por ejemplo, 'bloqueado') con reservas
      const mapped = slots.map((s: any) => {
        const rawOperativo = (s.estado_operativo || "").toString().toLowerCase();
        const bloqueado = rawOperativo.includes("bloqueado");
        const reservado = occSet.has(s.id);
        const ocupado = bloqueado || reservado;

        let estado = "libre";
        if (bloqueado) estado = "bloqueado";
        else if (reservado) estado = "ocupado";

        const disponible = !ocupado;

        return {
          id: s.id,
          estacionamiento_id: s.estacionamiento_id,
          numero: s.codigo,
          estado,
          ocupado,
          disponible,
          estado_operativo: s.estado_operativo,
        };
      });

      const total = mapped.length;
      const ocupados = mapped.reduce(
        (acc: number, s: any) => acc + (s.ocupado ? 1 : 0),
        0
      );
      const libres = Math.max(0, total - ocupados);

      res.json({ total, ocupados, libres, slots: mapped });
    } catch (err) {
      next(err);
    }
  }
);

router.get("/:id", JwtValidator.validateJwt, controller.getById);
router.patch("/:id", JwtValidator.validateJwt, controller.update);
router.delete("/:id", JwtValidator.validateJwt, controller.delete);

export default router;
