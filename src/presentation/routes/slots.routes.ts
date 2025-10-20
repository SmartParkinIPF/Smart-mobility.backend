import { Router } from "express";
import { SlotsController } from "../controllers/Slots.Controller";
import { SlotsService } from "../../domain/services/Slots.Service";
import { SlotsSupabaseRepository } from "../../infra/repositories/SlotsRepository";

const router = Router();
const controller = new SlotsController(new SlotsService(new SlotsSupabaseRepository()));

router.post("/", controller.create);
router.get("/", controller.list);
router.get("/:id", controller.getById);
router.get("/por-estacionamiento/:estacionamientoId", controller.listByEstacionamiento);
router.patch("/:id", controller.update);
router.delete("/:id", controller.delete);

export default router;

