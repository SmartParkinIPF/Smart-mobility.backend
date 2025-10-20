import { Router } from "express";
import { EstacionamientoController } from "../controllers/Estacionamiento.Controller";
import { EstacionamientoService } from "../../domain/services/Estacionamiento.Service";
import { EstacionamientoSupabaseRepository } from "../../infra/repositories/EstacionamientoRepository";
import { UsersRepository } from "../../infra/repositories/UserRepository";
import { AuthUserRepository } from "../../infra/repositories/AuthUserRepository";

const router = Router();
const controller = new EstacionamientoController(
  new EstacionamientoService(
    new EstacionamientoSupabaseRepository(),
    new UsersRepository(),
    new AuthUserRepository()
  )
);

router.post("/", controller.create);
router.get("/", controller.list);
router.get("/:id", controller.getById);
router.get("/por-establecimiento/:establecimientoId", controller.listByEstablecimiento);
router.patch("/:id", controller.update);
router.delete("/:id", controller.delete);

export default router;
