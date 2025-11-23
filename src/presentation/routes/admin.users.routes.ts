import { Router } from "express";
import { UsersRepository } from "../../infra/repositories/UserRepository";
import { AuthUserRepository } from "../../infra/repositories/AuthUserRepository";
import { UserService } from "../../domain/services/User.Service";
import { RoleService } from "../../domain/services/Role.Service";
import { ValidatorJwt } from "../../core/middleware/validateJwt";
import { requireAdmin } from "../../core/middleware/auth";
import { registerSchema } from "../../infra/validators/user.validator";
import { UsersController } from "../controllers/Users.Controller";

const router = Router();
const JwtValidator = new ValidatorJwt();
const usersRepository = new UsersRepository();
const authUserRepository = new AuthUserRepository();
const userService = new UserService(usersRepository, authUserRepository);
const roleService = new RoleService(usersRepository, authUserRepository);
const usersController = new UsersController(roleService, userService);

// GET /api/admin/users?page=1&limit=20&q=abc
router.get("/", JwtValidator.validateJwt, requireAdmin, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10) || 20));
    const q = String(req.query.q ?? "");
    const { items, total } = await usersRepository.listPaged({ page, limit, q });
    res.json({ items, total, page, limit });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/users (crear)
router.post("/", JwtValidator.validateJwt, requireAdmin, async (req, res, next) => {
  try {
    const parsed = registerSchema.parse(req.body);
    const created = await userService.register(parsed as any);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// Reusar controladores existentes para operaciones por id (requieren body con requester)
router.get("/:userId", JwtValidator.validateJwt, requireAdmin, usersController.getProfile);
router.patch("/:userId/profile", JwtValidator.validateJwt, requireAdmin, usersController.updateProfile);
router.patch("/:userId/role", JwtValidator.validateJwt, requireAdmin, usersController.assignRole);
router.delete("/:userId", JwtValidator.validateJwt, requireAdmin, usersController.delete);

export default router;

