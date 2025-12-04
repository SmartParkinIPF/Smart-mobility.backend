import { Router } from "express";
import { AlertasController } from "../controllers/Alertas.Controller";
import { ValidatorJwt } from "../../core/middleware/validateJwt";

const JwtValidator = new ValidatorJwt();
const controller = new AlertasController();
const router = Router();

// Usuario (cualquier rol autenticado) crea alerta
router.post("/alertas", JwtValidator.validateJwt, controller.create);

// Encargado lee sus alertas
router.get(
  "/encargado/alertas",
  JwtValidator.validateJwt,
  controller.listForEncargado
);

// SSE stream para encargados
router.get(
  "/encargado/alertas/stream",
  JwtValidator.validateJwt,
  controller.streamForEncargado
);

// Marcar leida
router.patch(
  "/encargado/alertas/:id/read",
  JwtValidator.validateJwt,
  controller.markRead
);

// Cambiar estado (ej: atendido)
router.patch(
  "/encargado/alertas/:id/estado",
  JwtValidator.validateJwt,
  controller.updateEstado
);

export default router;
