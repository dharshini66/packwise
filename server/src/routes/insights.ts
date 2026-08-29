import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const insightsCache = new Map<string, { expiresAt: number; insights: any }>();

const airportData: Record<string, { code: string; timezone: string; offset: string }> = {
  stockholm: { code: "ARN", timezone: "Europe/Stockholm", offset: "GMT+1" },
  stolkhol: { code: "ARN", timezone: "Europe/Stockholm", offset: "GMT+1" },
  tokyo: { code: "HND", timezone: "Asia/Tokyo", offset: "GMT+9" },
  japan: { code: "NRT", timezone: "Asia/Tokyo", offset: "GMT+9" },
  paris: { code: "CDG", timezone: "Europe/Paris", offset: "GMT+1" },
  france: { code: "CDG", timezone: "Europe/Paris", offset: "GMT+1" },
  lisbon: { code: "LIS", timezone: "Europe/Lisbon", offset: "GMT+0" },
  portugal: { code: "LIS", timezone: "Europe/Lisbon", offset: "GMT+0" },
  london: { code: "LHR", timezone: "Europe/London", offset: "GMT+0" },
  uk: { code: "LHR", timezone: "Europe/London", offset: "GMT+0" },
  england: { code: "LHR", timezone: "Europe/London", offset: "GMT+0" },
  "new york": { code: "JFK", timezone: "America/New_York", offset: "GMT-5" },
  usa: { code: "JFK", timezone: "America/New_York", offset: "GMT-5" },
  america: { code: "JFK", timezone: "America/New_York", offset: "GMT-5" },
  "cape town": { code: "CPT", timezone: "Africa/Johannesburg", offset: "GMT+2" },
  "south africa": { code: "CPT", timezone: "Africa/Johannesburg", offset: "GMT+2" },
  marrakech: { code: "RAK", timezone: "Africa/Casablanca", offset: "GMT+1" },
  morocco: { code: "RAK", timezone: "Africa/Casablanca", offset: "GMT+1" },
  reykjavik: { code: "KEF", timezone: "Atlantic/Reykjavik", offset: "GMT+0" },
  iceland: { code: "KEF", timezone: "Atlantic/Reykjavik", offset: "GMT+0" },
  havana: { code: "HAV", timezone: "America/Havana", offset: "GMT-5" },
  cuba: { code: "HAV", timezone: "America/Havana", offset: "GMT-5" },
  goa: { code: "GOI", timezone: "Asia/Kolkata", offset: "GMT+5.5" },
  india: { code: "DEL", timezone: "Asia/Kolkata", offset: "GMT+5.5" },
  delhi: { code: "DEL", timezone: "Asia/Kolkata", offset: "GMT+5.5" },
  mumbai: { code: "BOM", timezone: "Asia/Kolkata", offset: "GMT+5.5" },
  bangalore: { code: "BLR", timezone: "Asia/Kolkata", offset: "GMT+5.5" },
  sydney: { code: "SYD", timezone: "Australia/Sydney", offset: "GMT+10" },
  australia: { code: "SYD", timezone: "Australia/Sydney", offset: "GMT+10" },
  melbourne: { code: "MEL", timezone: "Australia/Melbourne", offset: "GMT+10" },
  singapore: { code: "SIN", timezone: "Asia/Singapore", offset: "GMT+8" },
  dubai: { code: "DXB", timezone: "Asia/Dubai", offset: "GMT+4" },
  uae: { code: "DXB", timezone: "Asia/Dubai", offset: "GMT+4" },
  cairo: { code: "CAI", timezone: "Africa/Cairo", offset: "GMT+2" },
  egypt: { code: "CAI", timezone: "Africa/Cairo", offset: "GMT+2" },
  rome: { code: "FCO", timezone: "Europe/Rome", offset: "GMT+1" },
  italy: { code: "FCO", timezone: "Europe/Rome", offset: "GMT+1" },
  berlin: { code: "BER", timezone: "Europe/Berlin", offset: "GMT+1" },
  germany: { code: "BER", timezone: "Europe/Berlin", offset: "GMT+1" },
  munich: { code: "MUC", timezone: "Europe/Berlin", offset: "GMT+1" },
  frankfurt: { code: "FRA", timezone: "Europe/Berlin", offset: "GMT+1" },
  madrid: { code: "MAD", timezone: "Europe/Madrid", offset: "GMT+1" },
  spain: { code: "MAD", timezone: "Europe/Madrid", offset: "GMT+1" },
  barcelona: { code: "BCN", timezone: "Europe/Madrid", offset: "GMT+1" },
  amsterdam: { code: "AMS", timezone: "Europe/Amsterdam", offset: "GMT+1" },
  netherlands: { code: "AMS", timezone: "Europe/Amsterdam", offset: "GMT+1" },
  toronto: { code: "YYZ", timezone: "America/Toronto", offset: "GMT-5" },
  canada: { code: "YYZ", timezone: "America/Toronto", offset: "GMT-5" },
  vancouver: { code: "YVR", timezone: "America/Vancouver", offset: "GMT-8" },
  istanbul: { code: "IST", timezone: "Europe/Istanbul", offset: "GMT+3" },
  turkey: { code: "IST", timezone: "Europe/Istanbul", offset: "GMT+3" },
  seoul: { code: "ICN", timezone: "Asia/Seoul", offset: "GMT+9" },
  korea: { code: "ICN", timezone: "Asia/Seoul", offset: "GMT+9" },
  bangkok: { code: "BKK", timezone: "Asia/Bangkok", offset: "GMT+7" },
  thailand: { code: "BKK", timezone: "Asia/Bangkok", offset: "GMT+7" },
  shanghai: { code: "PVG", timezone: "Asia/Shanghai", offset: "GMT+8" },
  china: { code: "PEK", timezone: "Asia/Shanghai", offset: "GMT+8" },
  beijing: { code: "PEK", timezone: "Asia/Shanghai", offset: "GMT+8" },
  mexico: { code: "MEX", timezone: "America/Mexico_City", offset: "GMT-6" },
  rio: { code: "GIG", timezone: "America/Sao_Paulo", offset: "GMT-3" },
  brazil: { code: "GRU", timezone: "America/Sao_Paulo", offset: "GMT-3" },
  buenos: { code: "EZE", timezone: "America/Argentina/Buenos_Aires", offset: "GMT-3" },
  argentina: { code: "EZE", timezone: "America/Argentina/Buenos_Aires", offset: "GMT-3" },
  lima: { code: "LIM", timezone: "America/Lima", offset: "GMT-5" },
  peru: { code: "LIM", timezone: "America/Lima", offset: "GMT-5" },
};

async function resolveLocationDetails(locStr: string) {
  const normalized = locStr.toLowerCase().trim();
  const parts = normalized.split(",");
  const city = parts[0]?.trim() || normalized;
  const country = parts[parts.length - 1]?.trim() || city;

  // 1. Direct dictionary match
  if (airportData[city]) return airportData[city];
  if (airportData[country]) return airportData[country];

  // Look for sub-word prefix match
  for (const key in airportData) {
    if (city.includes(key) || key.includes(city)) {
      return airportData[key];
    }
  }

  // 2. Dynamic geocoding fallback to resolve timezone
  try {
    const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
    if (geoResponse.ok) {
      const geoData = (await geoResponse.json()) as any;
      const result = geoData?.results?.[0];
      if (result && result.timezone) {
        // Extract offset via Intl.DateTimeFormat helper
        const formatter = new Intl.DateTimeFormat("en-US", {
          timeZone: result.timezone,
          timeZoneName: "short"
        });
        const partsList = formatter.formatToParts(new Date());
        const tzName = partsList.find(p => p.type === "timeZoneName")?.value || "GMT";
        const code = city.replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase().padEnd(3, "APT");

        return {
          code,
          timezone: result.timezone,
          offset: tzName
        };
      }
    }
  } catch (err) {
    console.error("Geocoding lookup failed inside insights resolver:", err);
  }

  // 3. Absolute Fallback
  return {
    code: city.replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase().padEnd(3, "APT"),
    timezone: "UTC",
    offset: "GMT+0"
  };
}

import { lookupCountry } from "../lib/countries.js";

router.get("/", requireAuth, async (req, res) => {
  const destination = String(req.query.destination ?? "").trim();
  const origin = String(req.query.origin ?? "New York, USA").trim();

  if (!destination) {
    return res.json({
      originCode: "JFK",
      originTimezone: "America/New_York",
      originTimezoneOffset: "GMT-5",
      destinationCode: "ARN",
      destinationTimezone: "Europe/Stockholm",
      destinationTimezoneOffset: "GMT+1",
      currencyCode: "EUR",
      currencyName: "Euro",
      entryClearance: "Arrival card required at immigration. Complete in-flight.",
      connectivity: "SIM card or international roaming — confirm before departure.",
      notes: "“Itinerary saved. Travel essentials prepared.”"
    });
  }

  const cacheKey = `${origin.toLowerCase()}->${destination.toLowerCase()}`;
  const cached = insightsCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return res.json(cached.insights);
  }

  const destParts = destination.split(",");
  const destCity = destParts[0]?.trim() || destination;
  const destCountry = destParts[destParts.length - 1]?.trim() || destCity;

  try {
    const [originDetails, destDetails] = await Promise.all([
      resolveLocationDetails(origin),
      resolveLocationDetails(destination)
    ]);

    const cData = lookupCountry(destCountry);

    const insights = {
      originCode: originDetails.code,
      originTimezone: originDetails.timezone,
      originTimezoneOffset: originDetails.offset,
      destinationCode: destDetails.code,
      destinationTimezone: destDetails.timezone,
      destinationTimezoneOffset: destDetails.offset,
      currencyCode: cData.currencyCode,
      currencyName: cData.currencyName,
      entryClearance: `Valid passport required for entry into ${destCountry}. Ensure your passport is valid for at least 3-6 months.`,
      connectivity: `Mobile roaming covers ${destCountry} (${cData.subregion}). Local eSIM/SIM cards are widely available at ${destCity} airports.`,
      notes: `“Exploring ${destCity}. Route: ${originDetails.code} ➔ ${destDetails.code}. Accommodation in ${destCountry} booked. Local travel passes and itineraries prepared in ${cData.language}.”`
    };

    insightsCache.set(cacheKey, { insights, expiresAt: Date.now() + 1000 * 60 * 60 * 24 }); // Cache for 24h
    return res.json(insights);
  } catch {
    // Dynamic Fallback
    const insights = {
      originCode: "JFK",
      originTimezone: "America/New_York",
      originTimezoneOffset: "GMT-5",
      destinationCode: destCity.replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase().padEnd(3, "APT"),
      destinationTimezone: "UTC",
      destinationTimezoneOffset: "GMT+0",
      currencyCode: "USD",
      currencyName: "United States Dollar",
      entryClearance: `Standard passport control rules apply at ${destCountry} border checkpoints. Complete entry clearances.`,
      connectivity: `Confirm roaming plans before landing in ${destCountry}. Public Wi-Fi and airport SIM vendors are available in ${destCity}.`,
      notes: `“Itinerary saved. Travel clearance from ${origin} to ${destCity}, ${destCountry} confirmed. Prepare manifests accordingly.”`
    };
    return res.json(insights);
  }
});

export default router;
