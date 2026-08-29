import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const imageCache = new Map<string, { expiresAt: number; url: string }>();

function isForbiddenTitle(title: string): boolean {
  const lower = title.toLowerCase();
  const forbidden = [
    "flag", "map", "location", "locator", "logo", "seal", "shield", "coat of arms", "outline", "blank"
  ];
  return forbidden.some(pattern => lower.includes(pattern));
}

function isForbiddenImage(url: string): boolean {
  const lower = url.toLowerCase();
  const forbidden = [
    "flag", "svg", "coat_of_arms", "map", "locator", "location",
    "orthographic", "logo", "seal", "shield", "chart", "diagram",
    "route", "blank", "state", "federal", "government", "arms.svg",
    "outline", "geography", "topography"
  ];
  return forbidden.some(pattern => lower.includes(pattern));
}

async function fetchWikiImage(searchQuery: string): Promise<string> {
  try {
    const headers = {
      "User-Agent": "PackWiseTravelApp/1.0 (contact@packwise.com; Portfolio Project)"
    };
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(searchQuery)}&gsrlimit=5&prop=pageimages&piprop=original&format=json&origin=*`;
    const res = await fetch(url, { headers });
    if (!res.ok) return "";
    const data = await res.json() as any;
    
    const pages = data?.query?.pages ?? {};
    const sortedPages = Object.values(pages).sort((a: any, b: any) => (a.index ?? 10) - (b.index ?? 10));
    
    for (const page of sortedPages as any[]) {
      if (isForbiddenTitle(page.title)) {
        continue;
      }
      const source = page.original?.source;
      if (source) {
        if (isForbiddenImage(source)) {
          continue;
        }
        return source;
      }
    }
  } catch (err) {
    console.error("Wikipedia image fetch failed:", err);
  }
  return "";
}

router.get("/", requireAuth, async (req, res) => {
  const query = String(req.query.query ?? "").trim();
  if (!query) return res.json({ url: "" });
  
  const cacheKey = query.toLowerCase();
  const cached = imageCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return res.json({ url: cached.url });
  }

  const city = query.split(",")[0]?.trim() || query;

  try {
    // Prioritize tourist skylines and landmark photographs over administrative listings
    // Query all variations in parallel to reduce first-time loading latency (from ~5s down to <200ms)
    const [skylineUrl, tourismUrl, landmarkUrl, cityUrl, queryUrl] = await Promise.all([
      fetchWikiImage(`${city} skyline`),
      fetchWikiImage(`${city} tourism`),
      fetchWikiImage(`${city} landmark`),
      fetchWikiImage(city),
      fetchWikiImage(query)
    ]);

    const url = skylineUrl || tourismUrl || landmarkUrl || cityUrl || queryUrl || "";

    if (url) {
      imageCache.set(cacheKey, { url, expiresAt: Date.now() + 1000 * 60 * 60 * 24 }); // Cache for 24 hours
    }
    return res.json({ url });
  } catch {
    return res.json({ url: "" });
  }
});

export default router;
