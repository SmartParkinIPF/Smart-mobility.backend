import { Router } from "express";
import { SlotsController } from "../controllers/Slots.Controller";
import { SlotsService } from "../../domain/services/Slots.Service";
import { SlotsSupabaseRepository } from "../../infra/repositories/SlotsRepository";
import { ValidatorJwt } from "../../core/middleware/validateJwt";

const JwtValidator = new ValidatorJwt();
const router = Router();
const controller = new SlotsController(
  new SlotsService(new SlotsSupabaseRepository())
);

router.post("/", JwtValidator.validateJwt, controller.create);
router.get("/", JwtValidator.validateJwt, controller.list);
router.get("/:id", JwtValidator.validateJwt, controller.getById);
router.get(
  "/por-estacionamiento/:estacionamientoId",
  JwtValidator.validateJwt,
  controller.listByEstacionamiento
);
router.patch("/:id", JwtValidator.validateJwt, controller.update);
router.delete("/:id", JwtValidator.validateJwt, controller.delete);

export default router;
