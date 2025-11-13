import { Router } from "express";
import { HorarioController } from "../controllers/Horario.Controller";
import { HorarioService } from "../../domain/services/Horario.Service";
import { HorariosSupabaseRepository } from "../../infra/repositories/HorarioRepository";
import { ValidatorJwt } from "../../core/middleware/validateJwt";

const router = Router();

const controller = new HorarioController(
  new HorarioService(new HorariosSupabaseRepository())
);
const jwt = new ValidatorJwt();

// CRUD horarios
router.post("/", jwt.validateJwt, controller.create);
router.get("/", jwt.validateJwt, controller.list);
router.get("/por-usuario/:userId", jwt.validateJwt, controller.listByUser);
router.get("/:id", jwt.validateJwt, controller.findById);
router.patch("/:id", jwt.validateJwt, controller.update);
router.delete("/:id", jwt.validateJwt, controller.remove);

export default router;
