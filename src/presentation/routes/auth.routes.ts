import { Router } from "express";
import { AuthController } from "../controllers/Authcontrollers";
import { UserService } from "../../domain/services/UserServices";
import { UsersRepository } from "../../infra/repositories/UserRepository";
import { AuthUserRepository } from "../../infra/repositories/AuthUserRepository";

const router = Router();
const controller = new AuthController(
  new UserService(new UsersRepository(), new AuthUserRepository())
);

router.post("/register", controller.register);
router.get("/hola", controller.hola);
router.post("/login", controller.login);
router.post("/logout", controller.logout);

export default router;
