import { Router } from "express";
import { ValidatorJwt } from "../../core/middleware/validateJwt";
import { NotificacionesController } from "../controllers/Notificaciones.Controller";

const JwtValidator = new ValidatorJwt();
const controller = new NotificacionesController();
const router = Router();

router.get("/notificaciones", JwtValidator.validateJwt, controller.listMine);
router.patch(
  "/notificaciones/:id/leida",
  JwtValidator.validateJwt,
  controller.markLeida
);

export default router;
