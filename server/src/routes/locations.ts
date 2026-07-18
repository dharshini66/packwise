import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const locationCache = new Map<string, { expiresAt: number; locations: Array<{ label: string }> }>();
router.get("/", requireAuth, async (req, res) => {
  const query = String(req.query.query ?? "").trim();
  if (query.length < 2) return res.json({ locations: [] });
  const cacheKey = query.toLowerCase();
  const cached = locationCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return res.json({ locations: cached.locations });
  try {
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`);
    const results = (await response.json()).results ?? [];
    const locations = results.map((place: { name: string; country?: string; admin1?: string }) => ({ label: [place.name, place.admin1, place.country].filter(Boolean).join(", ") }));
    locationCache.set(cacheKey, { locations, expiresAt: Date.now() + 1000 * 60 * 30 });
    res.json({ locations });
  } catch { res.json({ locations: [] }); }
});

export default router;
