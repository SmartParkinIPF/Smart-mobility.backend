// src/presentation/routes/agent.routes.ts
import { Router } from "express";
import { AgentController } from "../controllers/Agent.Controller";
import { AgentService } from "../../domain/services/Agent.Service";
import { EstacionamientoService } from "../../domain/services/Estacionamiento.Service";
import { ReservaService } from "../../domain/services/Reserva.Service";
import { EstacionamientoSupabaseRepository } from "../../infra/repositories/EstacionamientoRepository";
import { ReservasSupabaseRepository } from "../../infra/repositories/ReservaRepository";
import { UsersRepository } from "../../infra/repositories/UserRepository";
import { AuthUserRepository } from "../../infra/repositories/AuthUserRepository";
import { ValidatorJwt } from "../../core/middleware/validateJwt";

// Instanciamos los repositorios de infra
const estacionamientoRepo = new EstacionamientoSupabaseRepository();
const usersRepo = new UsersRepository();
const authUserRepo = new AuthUserRepository();
const reservasRepo = new ReservasSupabaseRepository();

// Construimos los servicios de dominio inyectando sus dependencias.
// EstacionamientoService necesita tres argumentos: repo de estacionamientos,
// repo de usuarios y repo de usuarios autenticados.
const estacionamientoService = new EstacionamientoService(
  estacionamientoRepo,
  usersRepo,
  authUserRepo
);

// ReservaService solo requiere su repositorio específico.
const reservaService = new ReservaService(reservasRepo);

// Creamos el servicio orquestador del agente y su controlador.
const agentService = new AgentService(estacionamientoService, reservaService);
const agentController = new AgentController(agentService);

// Middleware de validación de JWT.
const jwtValidator = new ValidatorJwt();

const router = Router();

/**
 * Ruta protegida por JWT que entrega la funcionalidad del agente.
 * El controlador se encarga de procesar el mensaje del usuario.
 */
router.post("/agent", jwtValidator.validateJwt, (req, res) => {
  agentController.handle(req, res);
});

export default router;
