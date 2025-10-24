import { Router } from "express";
import { UsersController } from "../controllers/Users.Controller";
import { RoleService } from "../../domain/services/Role.Service";
import { UsersRepository } from "../../infra/repositories/UserRepository";
import { AuthUserRepository } from "../../infra/repositories/AuthUserRepository";
import { UserService } from "../../domain/services/User.Service";
import { ValidatorJwt } from "../../core/middleware/validateJwt";

const JwtValidator = new ValidatorJwt();

const router = Router();
const usersRepository = new UsersRepository();
const authUserRepository = new AuthUserRepository();
const controller = new UsersController(
  new RoleService(usersRepository, authUserRepository),
  new UserService(usersRepository, authUserRepository)
);

router.patch(
  "/:userId/profile",
  JwtValidator.validateJwt,
  controller.updateProfile
);
router.patch("/:userId/role", JwtValidator.validateJwt, controller.assignRole);
router.delete("/:userId", JwtValidator.validateJwt, controller.delete);

export default router;
