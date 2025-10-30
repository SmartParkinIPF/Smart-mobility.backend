import { Router } from "express";
import { EstacionamientoController } from "../controllers/Estacionamiento.Controller";
import { EstacionamientoService } from "../../domain/services/Estacionamiento.Service";
import { EstacionamientoSupabaseRepository } from "../../infra/repositories/EstacionamientoRepository";
import { UsersRepository } from "../../infra/repositories/UserRepository";
import { AuthUserRepository } from "../../infra/repositories/AuthUserRepository";
import { ValidatorJwt } from "../../core/middleware/validateJwt";
const JwtValidator = new ValidatorJwt();
const router = Router();
const controller = new EstacionamientoController(
  new EstacionamientoService(
    new EstacionamientoSupabaseRepository(),
    new UsersRepository(),
    new AuthUserRepository()
  )
);

router.post("/", JwtValidator.validateJwt, controller.create);
router.get("/", JwtValidator.validateJwt, controller.list);
router.get("/:id", JwtValidator.validateJwt, controller.getById);
router.get(
  "/por-establecimiento/:establecimientoId",
  JwtValidator.validateJwt,
  controller.listByEstablecimiento
);
router.patch("/:id", JwtValidator.validateJwt, controller.update);
router.delete("/:id", JwtValidator.validateJwt, controller.delete);

export default router;
