import { Router } from "express";
import { EstablecimientoController } from "../controllers/Establecimiento.Controller";
import { EstablecimientoService } from "../../domain/services/Establecimiento.Service";
import { EstablecimientoSupabaseRepository } from "../../infra/repositories/EstablecimientoRepository";
import { UsersRepository } from "../../infra/repositories/UserRepository";
import { AuthUserRepository } from "../../infra/repositories/AuthUserRepository";
import { ValidatorJwt } from "../../core/middleware/validateJwt";
import { requireAdmin } from "../../core/middleware/auth";

const JwtValidator = new ValidatorJwt();

const router = Router();
const controller = new EstablecimientoController(
  new EstablecimientoService(
    new EstablecimientoSupabaseRepository(),
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
    // @ts-ignore access to custom method
    const { items, total } = await (controller as any).service?.repo?.listPaged
      ? await (controller as any).service.repo.listPaged({ page, limit, q })
      : await new EstablecimientoSupabaseRepository().listPaged({ page, limit, q });
    res.json({ items, total, page, limit });
  } catch (err) {
    next(err);
  }
});
router.get("/:id", JwtValidator.validateJwt, requireAdmin, controller.getById);
router.post("/", JwtValidator.validateJwt, requireAdmin, controller.create);
router.patch("/:id", JwtValidator.validateJwt, requireAdmin, controller.update);
router.delete("/:id", JwtValidator.validateJwt, requireAdmin, controller.delete);

export default router;
