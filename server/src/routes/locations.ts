import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.get("/", requireAuth, async (req, res) => {
  const query = String(req.query.query ?? "").trim();
  if (query.length < 2) return res.json({ locations: [] });
  try {
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`);
    const results = (await response.json()).results ?? [];
    res.json({ locations: results.map((place: { name: string; country?: string; admin1?: string }) => ({ label: [place.name, place.admin1, place.country].filter(Boolean).join(", ") })) });
  } catch { res.json({ locations: [] }); }
});

export default router;
