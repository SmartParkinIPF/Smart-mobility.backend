import { Router } from "express";
import auth from "./auth.routes";
import map from "./map.routes";
import users from "./user.routes";
import establecimientos from "./establecimientos.routes";
import estacionamientos from "./estacionamientos.routes";
import slots from "./slots.routes";

const router = Router();
router.use("/auth", auth);
router.use("/map", map);
router.use("/users", users);
router.use("/establecimientos", establecimientos);
router.use("/estacionamientos", estacionamientos);
router.use("/slots", slots);
export default router;
