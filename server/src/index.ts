import "dotenv/config";
import cors from "cors";
import express from "express";
import authRouter from "./routes/auth.js";
import journeysRouter from "./routes/journeys.js";
import blueprintsRouter from "./routes/blueprints.js";
import weatherRouter from "./routes/weather.js";
import locationsRouter from "./routes/locations.js";

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is required. Copy .env.example to .env first.");

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json());
app.get("/api/health", (_req, res) => res.json({ status: "cleared", service: "PackWise API" }));
app.use("/api/auth", authRouter);
app.use("/api/journeys", journeysRouter);
app.use("/api/blueprints", blueprintsRouter);
app.use("/api/weather", weatherRouter);
app.use("/api/locations", locationsRouter);

app.listen(Number(process.env.PORT ?? 4000), () => {
  console.log("PackWise API ready for departure on port " + (process.env.PORT ?? 4000));
});
