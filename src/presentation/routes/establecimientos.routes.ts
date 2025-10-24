import { Router } from "express";
import { EstablecimientoController } from "../controllers/Establecimiento.Controller";
import { EstablecimientoService } from "../../domain/services/Establecimiento.Service";
import { EstablecimientoSupabaseRepository } from "../../infra/repositories/EstablecimientoRepository";
import { UsersRepository } from "../../infra/repositories/UserRepository";
import { AuthUserRepository } from "../../infra/repositories/AuthUserRepository";
import { ValidatorJwt } from "../../core/middleware/validateJwt";

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
router.get("/:id", JwtValidator.validateJwt, controller.getById);
router.patch("/:id", JwtValidator.validateJwt, controller.update);
router.delete("/:id", JwtValidator.validateJwt, controller.delete);

export default router;
