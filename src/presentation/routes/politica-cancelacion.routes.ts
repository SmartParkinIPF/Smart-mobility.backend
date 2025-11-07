import { Router } from "express";
import { PoliticaCancelacionController } from "../controllers/PoliticaCancelacion.Controller";
import { PoliticaCancelacionService } from "../../domain/services/PoliticaCancelacion.Service";
import { PoliticasCancelacionSupabaseRepository } from "../../infra/repositories/PoliticaCancelacionRepository";
import { ValidatorJwt } from "../../core/middleware/validateJwt";

const router = Router();

const controller = new PoliticaCancelacionController(
  new PoliticaCancelacionService(new PoliticasCancelacionSupabaseRepository())
);
const jwt = new ValidatorJwt();

router.post("/", jwt.validateJwt, controller.create);
router.get("/", jwt.validateJwt, controller.list);
router.get("/:id", jwt.validateJwt, controller.findById);
router.patch("/:id", jwt.validateJwt, controller.update);
router.delete("/:id", jwt.validateJwt, controller.remove);

export default router;

