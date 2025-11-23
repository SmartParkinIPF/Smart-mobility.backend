import { Router } from "express";
import { ReservasController } from "../controllers/Reservas.Controller";
import { ReservaService } from "../../domain/services/Reserva.Service";
import { ReservasSupabaseRepository } from "../../infra/repositories/ReservaRepository";
import { ValidatorJwt } from "../../core/middleware/validateJwt";

const router = Router();

const controller = new ReservasController(
  new ReservaService(new ReservasSupabaseRepository())
);
const jwt = new ValidatorJwt();

// Crear reserva (estado inicial: pendiente_pago)
router.post("/", jwt.validateJwt, controller.create);

// Mis reservas (filtrables por estado)
router.get("/mias", jwt.validateJwt, controller.myList);

// Obtener por id
router.get("/:id", jwt.validateJwt, controller.getById);

// Actualizar parcialmente (fechas, slot, precio, etc.)
router.patch("/:id", jwt.validateJwt, controller.update);

// Confirmar reserva (y opcional asignar slot)
router.post("/:id/confirmar", jwt.validateJwt, controller.confirmar);

// Cancelar reserva
router.post("/:id/cancelar", jwt.validateJwt, controller.cancelar);

// Crear intención de pago para la reserva (opcional)
router.post("/:id/pago", jwt.validateJwt, controller.crearPago);

export default router;
