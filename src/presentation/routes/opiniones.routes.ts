import { Router } from "express";
import { OpinionesController } from "../controllers/Opiniones.Controller";
import { OpinionService } from "../../domain/services/Opinion.Service";
import { OpinionesSupabaseRepository } from "../../infra/repositories/OpinionRepository";
import { ValidatorJwt } from "../../core/middleware/validateJwt";

const router = Router();
const controller = new OpinionesController(
  new OpinionService(new OpinionesSupabaseRepository())
);
const jwt = new ValidatorJwt();

router.post("/", jwt.validateJwt, controller.create);
router.get("/establecimiento/:establecimientoId", controller.listByEstablecimiento);
router.get("/mine", jwt.validateJwt, controller.listMine);
router.get("/:id", controller.getById);
router.patch("/:id", jwt.validateJwt, controller.updateOwn);
router.delete("/:id", jwt.validateJwt, controller.deleteOwn);

export default router;
