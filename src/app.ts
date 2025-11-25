import express from "express";
import cors from "cors";
import routes from "./presentation/routes";
import { errorHandler } from "./core/middleware/errorHandler";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import { ENV } from "./config/env";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://smartparking.com",
  "https://panel.smartparking.com",
];

app.use(cors({ origin: "http://localhost:5173", credentials: true }));

app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(morgan("dev"));
app.get("/", (_req, res) => res.send("API OK"));

// Landing simple para los retornos de PayPal (éxito/pendiente/error)
const payReturnPage = (title: string, message: string) => `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
body { font-family: Arial, sans-serif; background:#0b1220; color:#e5e7eb; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; padding:16px; }
.box { background:#111827; padding:24px 20px; border-radius:14px; border:1px solid #1f2937; max-width:420px; text-align:center; }
h1 { margin:0 0 12px; font-size:22px; }
p { margin:6px 0; line-height:1.5; color:#cbd5e1; }
.hint { font-size:14px; color:#94a3b8; }
</style></head><body><div class="box">
<h1>${title}</h1>
<p>${message}</p>
<p class="hint">Ya podés volver a la app para ver el estado actualizado.</p>
</div></body></html>`;

app.get("/pay/return/success", (_req, res) =>
  res.status(200).send(payReturnPage("Pago completado", "Pago completado con éxito."))
);
app.get("/pay/return/pending", (_req, res) =>
  res.status(200).send(payReturnPage("Pago pendiente", "Tu pago quedó pendiente o en revisión."))
);
app.get("/pay/return/failure", (_req, res) =>
  res.status(200).send(payReturnPage("Pago cancelado", "El pago fue cancelado o falló."))
);

app.use("/api", routes);

app.use(errorHandler);

export default app;
