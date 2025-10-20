import { Router } from "express";
import { AuthController } from "../controllers/Auth.Controller";
import { UserService } from "../../domain/services/User.Service";
import { UsersRepository } from "../../infra/repositories/UserRepository";
import { AuthUserRepository } from "../../infra/repositories/AuthUserRepository";
import { ValidatorJwt } from "../../core/middleware/validateJwt";

const router = Router();

export const JwtValidator = new ValidatorJwt();
const controller = new AuthController(
  new UserService(new UsersRepository(), new AuthUserRepository())
);

router.post("/register", controller.register);
router.get("/session", JwtValidator.validateJwt, controller.session);
router.post("/login", controller.login);
router.post("/logout", JwtValidator.validateJwt, controller.logout);

export default router;
