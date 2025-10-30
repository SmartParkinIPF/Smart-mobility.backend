import { Router } from "express";
import { MapController } from "../controllers/Map.Controller";
import { MapMarkerService } from "../../domain/services/MapMarker.Service";
import { MapMarkerSupabaseRepository } from "../../infra/repositories/MapMarkerRepository";

const router = Router();
const controller = new MapController(
  new MapMarkerService(new MapMarkerSupabaseRepository())
);

router.get("/markers", controller.list);
router.post("/markers", controller.create);

export default router;
