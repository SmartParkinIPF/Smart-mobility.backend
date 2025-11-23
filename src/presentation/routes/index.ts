import { Router } from "express";
import auth from "./auth.routes";
import map from "./map.routes";
import users from "./user.routes";
import establecimientos from "./establecimientos.routes";
import estacionamientos from "./estacionamientos.routes";
import slots from "./slots.routes";
import horarios from "./horario.routes";
import tarifas from "./tarifa.routes";
import politicas from "./politica-cancelacion.routes";
import pagos from "./pagos.routes";
import reservas from "./reservas.routes";
import opiniones from "./opiniones.routes";
import adminEstablecimientos from "./admin.establecimientos.routes";
import adminEstacionamientos from "./admin.estacionamientos.routes";
import adminUsers from "./admin.users.routes";
//Luca agregó esto
import agentRoutes from "./Agent.routes";

const router = Router();
router.use("/auth", auth);
router.use("/map", map);
router.use("/users", users);
router.use("/establecimientos", establecimientos);
router.use("/estacionamientos", estacionamientos);
router.use("/slots", slots);
router.use("/horarios", horarios);
router.use("/tarifas", tarifas);
router.use("/politicas-cancelacion", politicas);
router.use("/pagos", pagos);
router.use("/reservas", reservas);
router.use("/opiniones", opiniones);
router.use("/admin/establecimientos", adminEstablecimientos);
router.use("/admin/estacionamientos", adminEstacionamientos);
router.use("/admin/users", adminUsers);
// Luca agregó esta parte
router.use(agentRoutes);
export default router;
