import { Router } from "express";
import { UsersController } from "../controllers/Users.Controller";
import { RoleService } from "../../domain/services/Role.Service";
import { UsersRepository } from "../../infra/repositories/UserRepository";
import { AuthUserRepository } from "../../infra/repositories/AuthUserRepository";
import { UserService } from "../../domain/services/User.Service";

const router = Router();
const usersRepository = new UsersRepository();
const authUserRepository = new AuthUserRepository();
const controller = new UsersController(
  new RoleService(usersRepository, authUserRepository),
  new UserService(usersRepository, authUserRepository)
);

router.patch("/:userId/profile", controller.updateProfile);
router.patch("/:userId/role", controller.assignRole);
router.delete("/:userId", controller.delete);

export default router;
