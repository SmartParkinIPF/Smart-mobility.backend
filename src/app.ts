import express from "express";
import cors from "cors";
import routes from "./presentation/routes";
import { errorHandler } from "./core/middleware/errorHandler";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => res.send("API OK"));
app.use("/api", routes);

app.use(errorHandler);

export default app;
