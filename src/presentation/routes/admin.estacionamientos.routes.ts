import { Router } from "express";
import { EstacionamientoController } from "../controllers/Estacionamiento.Controller";
import { EstacionamientoService } from "../../domain/services/Estacionamiento.Service";
import { EstacionamientoSupabaseRepository } from "../../infra/repositories/EstacionamientoRepository";
import { UsersRepository } from "../../infra/repositories/UserRepository";
import { AuthUserRepository } from "../../infra/repositories/AuthUserRepository";
import { ValidatorJwt } from "../../core/middleware/validateJwt";
import { requireAdmin } from "../../core/middleware/auth";

const JwtValidator = new ValidatorJwt();
const router = Router();
const controller = new EstacionamientoController(
  new EstacionamientoService(
    new EstacionamientoSupabaseRepository(),
    new UsersRepository(),
    new AuthUserRepository()
  )
);

// Admin-scoped list with pagination and search by nombre
router.get("/", JwtValidator.validateJwt, requireAdmin, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10) || 20));
    const q = String(req.query.q ?? "");
    const repo = new EstacionamientoSupabaseRepository();
    // @ts-ignore
    const { items, total } = await repo.listPaged({ page, limit, q });
    res.json({ items, total, page, limit });
  } catch (err) {
    next(err);
  }
});
router.get("/:id", JwtValidator.validateJwt, requireAdmin, controller.getById);
router.get(
  "/por-establecimiento/:establecimientoId",
  JwtValidator.validateJwt,
  requireAdmin,
  controller.listByEstablecimiento
);
router.post("/", JwtValidator.validateJwt, requireAdmin, controller.create);
router.patch("/:id", JwtValidator.validateJwt, requireAdmin, controller.update);
router.delete("/:id", JwtValidator.validateJwt, requireAdmin, controller.delete);

export default router;
