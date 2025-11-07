import { Router } from "express";
import { TarifaController } from "../controllers/Tarifa.Controller";
import { TarifaService } from "../../domain/services/Tarifa.Service";
import { TarifasSupabaseRepository } from "../../infra/repositories/TarifaRepository";
import { ValidatorJwt } from "../../core/middleware/validateJwt";

const router = Router();

const controller = new TarifaController(
  new TarifaService(new TarifasSupabaseRepository())
);
const jwt = new ValidatorJwt();

router.post("/", jwt.validateJwt, controller.create);
router.get("/", jwt.validateJwt, controller.list);
router.get("/:id", jwt.validateJwt, controller.findById);
router.patch("/:id", jwt.validateJwt, controller.update);
router.delete("/:id", jwt.validateJwt, controller.remove);

export default router;

