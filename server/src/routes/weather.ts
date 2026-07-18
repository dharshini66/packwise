import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const weatherCache = new Map<string, { expiresAt: number; result: object }>();

router.get("/", requireAuth, async (req, res) => {
  const destination = String(req.query.destination ?? "").trim();
  if (!destination) return res.status(400).json({ message: "A destination is required for weather clearance." });
  const cacheKey = destination.toLowerCase();
  const cached = weatherCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return res.json(cached.result);
  try {
    const geocoding = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1&language=en&format=json`);
    const location = (await geocoding.json())?.results?.[0];
    if (!location) return res.status(404).json({ message: "Destination weather could not be located." });
    const forecast = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,weather_code&timezone=auto`);
    const current = (await forecast.json()).current;
    const temperature = Math.round(current.temperature_2m);
    const code = Number(current.weather_code);
    const condition = code >= 51 ? "Rain" : temperature <= 14 ? "Cold" : temperature >= 28 ? "Hot" : "Mild";
    const suggestions = condition === "Rain" ? ["Umbrella", "Waterproof shoes", "Light rain jacket"] : condition === "Cold" ? ["Jacket", "Sweater", "Gloves"] : condition === "Hot" ? ["Sunscreen", "Hat", "Water bottle"] : ["Light layer", "Comfortable shoes", "Refillable bottle"];
    const result = { city: location.name, temperature, condition, suggestions };
    weatherCache.set(cacheKey, { result, expiresAt: Date.now() + 1000 * 60 * 30 });
    res.json(result);
  } catch {
    res.status(503).json({ message: "Weather clearance is temporarily unavailable." });
  }
});

export default router;
