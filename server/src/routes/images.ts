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
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&srlimit=5&format=json&origin=*`;
    const searchRes = await fetch(searchUrl, { headers });
    if (!searchRes.ok) return "";
    const searchData = await searchRes.json();
    const results = searchData?.query?.search ?? [];
    
    for (const result of results) {
      const title = result.title;
      if (isForbiddenTitle(title)) {
        continue;
      }
      
      const imageUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&titles=${encodeURIComponent(title)}&piprop=original&format=json&origin=*`;
      const imgRes = await fetch(imageUrl, { headers });
      if (!imgRes.ok) continue;
      const imgData = await imgRes.json();
      
      const pages = imgData?.query?.pages ?? {};
      for (const pageId in pages) {
        const source = pages[pageId]?.original?.source;
        if (source) {
          if (isForbiddenImage(source)) {
            continue;
          }
          return source;
        }
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
    let url = await fetchWikiImage(`${city} skyline`);
    
    if (!url) {
      url = await fetchWikiImage(`${city} tourism`);
    }

    if (!url) {
      url = await fetchWikiImage(`${city} landmark`);
    }

    if (!url) {
      url = await fetchWikiImage(city);
    }

    if (!url) {
      url = await fetchWikiImage(query);
    }

    if (url) {
      imageCache.set(cacheKey, { url, expiresAt: Date.now() + 1000 * 60 * 60 * 24 }); // Cache for 24 hours
    }
    return res.json({ url });
  } catch {
    return res.json({ url: "" });
  }
});

export default router;
