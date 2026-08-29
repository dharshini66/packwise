import "dotenv/config";
import cors from "cors";
import express from "express";
import authRouter from "./routes/auth.js";
import journeysRouter from "./routes/journeys.js";
import blueprintsRouter from "./routes/blueprints.js";
import weatherRouter from "./routes/weather.js";
import locationsRouter from "./routes/locations.js";
import imagesRouter from "./routes/images.js";
import insightsRouter from "./routes/insights.js";

const requiredEnv = ["DATABASE_URL", "JWT_SECRET", "VISUAL_CROSSING_API_KEY"];
const missingEnv = requiredEnv.filter((env) => !process.env[env]);
if (missingEnv.length > 0) {
  console.error(`[Fatal] Missing required environment variables: ${missingEnv.join(", ")}`);
  process.exit(1);
}

const app = express();

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
  app.use((req, res, next) => {
    if (req.header("x-forwarded-proto") !== "https") {
      return res.redirect(`https://${req.header("host")}${req.url}`);
    }
    next();
  });
}

const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_ORIGIN
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.includes(origin) || 
                      origin.endsWith(".vercel.app") || 
                      /^http:\/\/localhost:\d+$/.test(origin);
                      
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.use(express.json());
app.get("/api/health", (_req, res) => res.json({ status: "cleared", service: "PackWise API" }));
app.use("/api/auth", authRouter);
app.use("/api/journeys", journeysRouter);
app.use("/api/blueprints", blueprintsRouter);
app.use("/api/weather", weatherRouter);
app.use("/api/locations", locationsRouter);
app.use("/api/images", imagesRouter);
app.use("/api/insights", insightsRouter);

import { prisma } from "./lib/prisma.js";
import { seedDefaultBlueprints } from "./lib/seeds.js";

void seedDefaultBlueprints(prisma).finally(() => {
  app.listen(Number(process.env.PORT ?? 4000), () => {
    console.log("PackWise API ready for departure on port " + (process.env.PORT ?? 4000));
  });
});
