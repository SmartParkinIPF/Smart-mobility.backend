import { Router } from "express";
import { EncargadoController } from "../controllers/Encargado.Controller";
import { EncargadoService } from "../../domain/services/Encargado.Service";
import { UsersRepository } from "../../infra/repositories/UserRepository";
import { AuthUserRepository } from "../../infra/repositories/AuthUserRepository";
import { EstablecimientoSupabaseRepository } from "../../infra/repositories/EstablecimientoRepository";
import { ValidatorJwt } from "../../core/middleware/validateJwt";

const JwtValidator = new ValidatorJwt();
const router = Router();

const controller = new EncargadoController(
  new EncargadoService(
    new UsersRepository(),
    new AuthUserRepository(),
    new EstablecimientoSupabaseRepository()
  )
);

// Crear o asignar encargado a un establecimiento del provider autenticado
router.post(
  "/establecimientos/:establecimientoId/encargado",
  JwtValidator.validateJwt,
  controller.createOrAssign
);

// Obtener encargado de un establecimiento (provider dueno u encargado)
router.get(
  "/establecimientos/:establecimientoId/encargado",
  JwtValidator.validateJwt,
  controller.getByEstablecimiento
);

// Actualizar datos del encargado (solo provider dueno)
router.patch(
  "/encargados/:encargadoId",
  JwtValidator.validateJwt,
  controller.update
);

// Desasignar encargado (lo degrada a usuario y limpia relacion)
router.delete(
  "/establecimientos/:establecimientoId/encargado",
  JwtValidator.validateJwt,
  controller.remove
);

export default router;
