import { Router } from "express";
import { PagosController } from "../controllers/Pagos.Controller";
import { PagoService } from "../../domain/services/Pago.Service";
import { PagosSupabaseRepository } from "../../infra/repositories/PagoRepository";
import { ValidatorJwt } from "../../core/middleware/validateJwt";

const router = Router();

const controller = new PagosController(new PagoService(new PagosSupabaseRepository()));
const jwt = new ValidatorJwt();

// Crear intención de pago con Mercado Pago (crea registro en 'pagos')
router.post("/", jwt.validateJwt, controller.createIntent);

// Consultar pago por id
router.get("/:id", jwt.validateJwt, controller.getById);

// Listar pagos por reserva
router.get("/reserva/:reservaId", jwt.validateJwt, controller.listByReserva);

// Webhook Mercado Pago (sin auth)
router.post("/webhook", controller.webhook);
router.get("/webhook", controller.webhook); // por compatibilidad

export default router;

