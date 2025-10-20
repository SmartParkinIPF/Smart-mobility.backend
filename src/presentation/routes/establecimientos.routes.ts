import { Router } from "express";
import { EstablecimientoController } from "../controllers/Establecimiento.Controller";
import { EstablecimientoService } from "../../domain/services/Establecimiento.Service";
import { EstablecimientoSupabaseRepository } from "../../infra/repositories/EstablecimientoRepository";
import { UsersRepository } from "../../infra/repositories/UserRepository";
import { AuthUserRepository } from "../../infra/repositories/AuthUserRepository";

const router = Router();
const controller = new EstablecimientoController(
  new EstablecimientoService(
    new EstablecimientoSupabaseRepository(),
    new UsersRepository(),
    new AuthUserRepository()
  )
);

router.post("/", controller.create);
router.get("/", controller.list);
router.get("/:id", controller.getById);
router.patch("/:id", controller.update);
router.delete("/:id", controller.delete);

export default router;
