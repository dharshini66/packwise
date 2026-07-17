import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const destination = String(req.query.destination ?? "").trim();
  if (!destination) return res.status(400).json({ message: "A destination is required for weather clearance." });
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
    res.json({ city: location.name, temperature, condition, suggestions });
  } catch {
    res.status(503).json({ message: "Weather clearance is temporarily unavailable." });
  }
});

export default router;
