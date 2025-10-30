import express from "express";
import cors from "cors";
import routes from "./presentation/routes";
import { errorHandler } from "./core/middleware/errorHandler";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";

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
app.use("/api", routes);

app.use(errorHandler);

export default app;
