import { Router } from "express";
import auth from "./auth.routes";
import map from "./map.routes";
import users from "./user.routes";

const router = Router();
router.use("/auth", auth);
router.use("/map", map);
router.use("/users", users);
export default router;
