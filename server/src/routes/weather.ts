import { Router, type Request, type Response as ExpressResponse } from "express";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface VisualCrossingHour {
  datetime: string;
  temp: number;
  conditions: string;
  icon: string;
  precipprob: number;
}

interface VisualCrossingDay {
  datetime: string;
  temp: number;
  feelslike: number;
  humidity: number;
  windspeed: number;
  precipprob: number;
  conditions: string;
  icon: string;
  tempmax: number;
  tempmin: number;
  uvindex: number;
  sunrise: string;
  sunset: string;
  hours?: VisualCrossingHour[];
}

interface VisualCrossingResponse {
  resolvedAddress?: string;
  address?: string;
  timezone?: string;
  days?: VisualCrossingDay[];
}

interface PackingRecommendation {
  item: string;
  reason: string;
}

interface DailyForecastEntry {
  label: string;
  date: string;
  high: number;
  low: number;
  condition: string;
  icon: string;
}

interface HourlyForecastEntry {
  label: string;
  temp: number;
  condition: string;
  icon: string;
}

interface DestinationInsights {
  currency: string;
  language: string;
  powerPlug: string;
  timezone: string;
  emergencyNumber: string;
  transportTip: string;
  weatherTip: string;
}

interface ForecastWeatherResult {
  mode: "forecast";
  city: string;
  country: string;
  date: string;
  updatedAt: string;
  current: {
    temperature: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    rainChance: number;
    uvIndex: number;
    uvCategory: string;
    condition: string;
    icon: string;
    sunrise: string;
    sunset: string;
  };
  daily: DailyForecastEntry[];
  hourly: HourlyForecastEntry[];
  alerts: string[];
  outfit: string[];
  packing: PackingRecommendation[];
  summary: string;
  insights: DestinationInsights;
}

interface ClimateWeatherResult {
  mode: "climate";
  city: string;
  country: string;
  month: string;
  averageHigh: number;
  averageLow: number;
  averageHumidity: number;
  averageRainChance: number;
  averageUvIndex: number;
  uvCategory: string;
  condition: string;
  outfit: string[];
  packing: PackingRecommendation[];
  summary: string;
  insights: DestinationInsights;
}

type WeatherResult = ForecastWeatherResult | ClimateWeatherResult;

interface CacheEntry {
  expiresAt: number;
  result: WeatherResult;
}

/* -------------------------------------------------------------------------- */
/*  Config / Cache                                                            */
/* -------------------------------------------------------------------------- */

const VISUAL_CROSSING_BASE_URL =
  "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline";
const FORECAST_WINDOW_DAYS = 15;
const FORECAST_RANGE_DAYS = 5;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const HISTORICAL_YEARS_BACK = [1, 2, 3, 4, 5];
const FETCH_TIMEOUT_MS = 10_000;
const HOURLY_SAMPLE_HOURS = [8, 11, 14, 17, 20];

const weatherCache = new Map<string, CacheEntry>();

/* -------------------------------------------------------------------------- */
/*  Destination insights lookup                                               */
/* -------------------------------------------------------------------------- */

const DESTINATION_INSIGHTS: Record<string, Omit<DestinationInsights, "timezone">> = {
  Japan: { currency: "Japanese Yen (JPY)", language: "Japanese", powerPlug: "Type A", emergencyNumber: "110 / 119", transportTip: "Get a Suica or Pasmo card for trains and buses.", weatherTip: "Summers are hot and humid; winters are mild but dry." },
  France: { currency: "Euro (EUR)", language: "French", powerPlug: "Type E", emergencyNumber: "112", transportTip: "The Metro is fast and covers most of Paris.", weatherTip: "Expect mild weather with occasional rain year-round." },
  "United Kingdom": { currency: "British Pound (GBP)", language: "English", powerPlug: "Type G", emergencyNumber: "999", transportTip: "An Oyster card covers the Tube, buses, and rail.", weatherTip: "Pack layers — weather can change within the same day." },
  "United States": { currency: "US Dollar (USD)", language: "English", powerPlug: "Type A/B", emergencyNumber: "911", transportTip: "Ride-share apps are widely available in most cities.", weatherTip: "Climate varies drastically by region and season." },
  Argentina: { currency: "Argentine Peso (ARS)", language: "Spanish", powerPlug: "Type C/I", emergencyNumber: "911", transportTip: "Get a SUBE card for buses and subway in Buenos Aires.", weatherTip: "Seasons are reversed from the Northern Hemisphere." },
  India: { currency: "Indian Rupee (INR)", language: "Hindi, English, and regional languages", powerPlug: "Type C/D/M", emergencyNumber: "112", transportTip: "Use app-based rideshares or metro in major cities.", weatherTip: "Monsoon season (June–September) brings heavy rain." },
  Germany: { currency: "Euro (EUR)", language: "German", powerPlug: "Type F", emergencyNumber: "112", transportTip: "Trains are punctual — validate tickets before boarding.", weatherTip: "Winters are cold; summers are mild and pleasant." },
  Italy: { currency: "Euro (EUR)", language: "Italian", powerPlug: "Type F/L", emergencyNumber: "112", transportTip: "Validate train tickets at the platform machines.", weatherTip: "Summers are hot, especially in the south." },
  Spain: { currency: "Euro (EUR)", language: "Spanish", powerPlug: "Type F", emergencyNumber: "112", transportTip: "Metro systems in Madrid and Barcelona are efficient.", weatherTip: "Summers can be very hot, particularly inland." },
  China: { currency: "Chinese Yuan (CNY)", language: "Mandarin", powerPlug: "Type A/C/I", emergencyNumber: "110 / 120", transportTip: "High-speed rail connects most major cities.", weatherTip: "Weather varies widely between northern and southern regions." },
  Australia: { currency: "Australian Dollar (AUD)", language: "English", powerPlug: "Type I", emergencyNumber: "000", transportTip: "Get a local transit card like Opal (Sydney) or Myki (Melbourne).", weatherTip: "Seasons are reversed from the Northern Hemisphere." },
  Canada: { currency: "Canadian Dollar (CAD)", language: "English and French", powerPlug: "Type A/B", emergencyNumber: "911", transportTip: "Cities have reliable public transit; distances between cities are large.", weatherTip: "Winters can be extremely cold, especially inland." },
  Thailand: { currency: "Thai Baht (THB)", language: "Thai", powerPlug: "Type A/B/C", emergencyNumber: "191", transportTip: "Tuk-tuks and the BTS Skytrain are common in Bangkok.", weatherTip: "Hot and humid most of the year; rainy season is May–October." },
  Mexico: { currency: "Mexican Peso (MXN)", language: "Spanish", powerPlug: "Type A/B", emergencyNumber: "911", transportTip: "Use registered taxis or rideshare apps for safety.", weatherTip: "Coastal areas are hot and humid; inland cities are milder." },
  Brazil: { currency: "Brazilian Real (BRL)", language: "Portuguese", powerPlug: "Type C/N", emergencyNumber: "190 / 192", transportTip: "Rideshare apps are reliable in most major cities.", weatherTip: "Tropical climate — expect heat and humidity most of the year." },
  "South Korea": { currency: "South Korean Won (KRW)", language: "Korean", powerPlug: "Type C/F", emergencyNumber: "112 / 119", transportTip: "Get a T-money card for subways and buses.", weatherTip: "Summers are hot and humid; winters are cold and dry." },
  Netherlands: { currency: "Euro (EUR)", language: "Dutch", powerPlug: "Type F", emergencyNumber: "112", transportTip: "Renting a bike is often the fastest way to get around.", weatherTip: "Expect mild temperatures and frequent rain." },
  "United Arab Emirates": { currency: "UAE Dirham (AED)", language: "Arabic", powerPlug: "Type G", emergencyNumber: "999", transportTip: "The Dubai Metro is clean, cheap, and efficient.", weatherTip: "Extremely hot in summer; mild and pleasant in winter." },
  Singapore: { currency: "Singapore Dollar (SGD)", language: "English, Malay, Mandarin, Tamil", powerPlug: "Type G", emergencyNumber: "999 / 995", transportTip: "The MRT covers nearly the entire city efficiently.", weatherTip: "Hot and humid year-round with frequent short showers." },
  Indonesia: { currency: "Indonesian Rupiah (IDR)", language: "Indonesian", powerPlug: "Type C/F", emergencyNumber: "112", transportTip: "Ride-hailing apps are the easiest way to get around.", weatherTip: "Tropical climate with a distinct wet season." },
};

const GENERIC_INSIGHTS: Omit<DestinationInsights, "timezone"> = {
  currency: "Check local currency before departure",
  language: "Local language may vary by region",
  powerPlug: "Verify plug type for this destination",
  emergencyNumber: "Check local emergency services number",
  transportTip: "Research local transit options ahead of arrival",
  weatherTip: "Check seasonal norms for this destination",
};

function getDestinationInsights(country: string, timezone: string): DestinationInsights {
  const match = DESTINATION_INSIGHTS[country];
  return { ...(match ?? GENERIC_INSIGHTS), timezone: timezone || "Local time" };
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00`);
  return !Number.isNaN(parsed.getTime());
}

function daysBetweenTodayAnd(dateStr: string): number {
  const target = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((target.getTime() - today.getTime()) / msPerDay);
}

function toIsoDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dateStr: string, amount: number): string {
  const date = new Date(`${dateStr}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return toIsoDateString(date);
}

function getMonthName(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleString("en-US", { month: "long" });
}

function dayLabelFor(dateStr: string): string {
  const today = toIsoDateString(new Date());
  const tomorrow = addDays(today, 1);
  if (dateStr === today) return "Today";
  if (dateStr === tomorrow) return "Tomorrow";
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", { weekday: "long" });
}

function formatHourLabel(datetime: string): string {
  const hour = Number(datetime.split(":")[0]);
  const period = hour >= 12 ? "PM" : "AM";
  const twelveHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelveHour} ${period}`;
}

function categorizeUv(uvIndex: number): string {
  if (uvIndex >= 11) return "Extreme";
  if (uvIndex >= 8) return "Very High";
  if (uvIndex >= 6) return "High";
  if (uvIndex >= 3) return "Moderate";
  return "Low";
}

function extractCity(resolvedAddress: string | undefined, fallback: string): string {
  return resolvedAddress?.split(",")[0]?.trim() || fallback;
}

function extractCountry(resolvedAddress: string | undefined): string {
  if (!resolvedAddress) return "";
  const parts = resolvedAddress.split(",").map((part) => part.trim());
  return parts[parts.length - 1] ?? "";
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchVisualCrossing(
  location: string,
  startDate: string,
  endDate: string,
  apiKey: string,
  include: string
): Promise<VisualCrossingResponse> {
  const url = `${VISUAL_CROSSING_BASE_URL}/${encodeURIComponent(
    location
  )}/${startDate}/${endDate}?unitGroup=metric&include=${include}&key=${encodeURIComponent(
    apiKey
  )}&contentType=json`;

  const response = await fetchWithTimeout(url);

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("VISUAL_CROSSING_AUTH_ERROR");
    }
    if (response.status === 400 || response.status === 404) {
      throw new Error("VISUAL_CROSSING_LOCATION_ERROR");
    }
    throw new Error(`VISUAL_CROSSING_HTTP_ERROR_${response.status}`);
  }

  const data = (await response.json()) as VisualCrossingResponse;
  if (!data.days || data.days.length === 0) {
    throw new Error("VISUAL_CROSSING_NO_DATA");
  }
  return data;
}

/* -------------------------------------------------------------------------- */
/*  Smart recommendation engine                                               */
/* -------------------------------------------------------------------------- */

interface ConditionSignals {
  avgTemp: number;
  condition: string;
  rainChance: number;
  humidity: number;
  uvIndex: number;
  windSpeed: number;
}

function classify(signals: ConditionSignals) {
  const conditionsLower = signals.condition.toLowerCase();
  const isSnow = /snow|sleet|blizzard/.test(conditionsLower) || (signals.avgTemp <= 0 && signals.rainChance >= 30);
  const isRain = /rain|shower|storm|drizzle|thunder/.test(conditionsLower) || signals.rainChance >= 40;
  const isHot = signals.avgTemp >= 28;
  const isCold = signals.avgTemp <= 10 && !isSnow;
  return { isSnow, isRain, isHot, isCold };
}

function generatePackingRecommendations(signals: ConditionSignals): PackingRecommendation[] {
  const { isSnow, isRain, isHot, isCold } = classify(signals);
  const recommendations = new Map<string, string>();

  if (isSnow) {
    recommendations.set("Thermal Wear", "Snow expected");
    recommendations.set("Winter Coat", "Snow expected");
    recommendations.set("Boots", "Snow expected");
  }
  if (isRain) {
    recommendations.set("Compact Umbrella", "Rain expected");
    recommendations.set("Waterproof Jacket", "Rain expected");
  }
  if (isHot) {
    recommendations.set("Portable Cooling Fan", "High temperature");
    recommendations.set("Sunscreen SPF50", "High temperature");
  }
  if (signals.humidity >= 70) {
    recommendations.set("Electrolytes", "High humidity");
  }
  if (signals.uvIndex >= 8) {
    recommendations.set("Sunscreen SPF50", "Very High UV Index");
  }
  if (isCold) {
    recommendations.set("Jacket", "Low temperature");
    recommendations.set("Sweater", "Low temperature");
  }
  if (signals.windSpeed >= 25) {
    recommendations.set("Windbreaker", "Strong winds expected");
  }
  if (recommendations.size === 0) {
    recommendations.set("Light Layers", "Comfortable for changing conditions");
    recommendations.set("Comfortable Shoes", "Great for exploring on foot");
  }

  return Array.from(recommendations.entries()).map(([item, reason]) => ({ item, reason }));
}

function generateOutfit(signals: ConditionSignals): string[] {
  const { isSnow, isHot, isCold } = classify(signals);
  if (isSnow) return ["Thermal Base Layer", "Winter Coat", "Insulated Boots", "Wool Socks", "Gloves"];
  if (isCold) return ["Long-Sleeve Shirt", "Warm Jacket", "Jeans", "Closed-Toe Shoes", "Scarf"];
  if (isHot) return ["Cotton T-Shirt", "Shorts", "Sneakers", "Hat", "Sunglasses"];
  return ["Light Sweater", "Comfortable Pants", "Sneakers", "Light Jacket"];
}

function generateAlerts(signals: ConditionSignals): string[] {
  const alerts: string[] = [];
  if (signals.uvIndex >= 8) alerts.push("⚠ High UV today");
  if (signals.avgTemp >= 35) alerts.push("🔥 Extreme heat warning");
  if (signals.avgTemp <= 0) alerts.push("❄️ Freezing temperatures expected");
  if (signals.rainChance >= 50) alerts.push("🌧 Afternoon showers expected");
  if (signals.humidity >= 70) alerts.push("💧 High humidity");
  if (signals.windSpeed >= 25) alerts.push("🌬 Strong winds expected");
  return alerts;
}

function describeTemperature(avgTemp: number, humidity: number): string {
  const base =
    avgTemp >= 28 ? "hot" : avgTemp >= 20 ? "warm" : avgTemp >= 10 ? "mild" : avgTemp >= 0 ? "cool" : "cold";
  if (avgTemp >= 26 && humidity >= 60) return `${base} and humid`;
  return base;
}

function generateSummary(city: string, signals: ConditionSignals): string {
  const { isRain, isSnow, isHot, isCold } = classify(signals);
  const tempDescriptor = describeTemperature(signals.avgTemp, signals.humidity);
  const conditionPhrase = isSnow
    ? " with snow expected"
    : isRain
    ? " with afternoon rain showers"
    : "";

  const advice = isSnow
    ? "Bundle up with thermal wear and waterproof boots."
    : isRain && isHot
    ? "Lightweight clothing, hydration, and a compact umbrella are strongly recommended."
    : isRain
    ? "Pack a compact umbrella and waterproof layers."
    : isCold
    ? "Layer up with warm clothing and accessories."
    : isHot
    ? "Pack lightweight clothing, sunscreen, and stay hydrated."
    : "Pack light layers to stay comfortable throughout the trip.";

  return `${city} will be ${tempDescriptor} during your stay${conditionPhrase}. ${advice}`;
}

/* -------------------------------------------------------------------------- */
/*  Data builders                                                             */
/* -------------------------------------------------------------------------- */

async function buildForecastResult(
  destination: string,
  dateStr: string,
  apiKey: string
): Promise<ForecastWeatherResult> {
  const endDate = addDays(dateStr, FORECAST_RANGE_DAYS - 1);
  const data = await fetchVisualCrossing(destination, dateStr, endDate, apiKey, "days,hours");
  const days = data.days!;
  const tripDay = days[0];

  const city = extractCity(data.resolvedAddress ?? data.address, destination);
  const country = extractCountry(data.resolvedAddress ?? data.address);

  const signals: ConditionSignals = {
    avgTemp: tripDay.temp,
    condition: tripDay.conditions ?? "",
    rainChance: tripDay.precipprob ?? 0,
    humidity: tripDay.humidity ?? 0,
    uvIndex: tripDay.uvindex ?? 0,
    windSpeed: tripDay.windspeed ?? 0,
  };

  const daily: DailyForecastEntry[] = days.map((day) => ({
    label: dayLabelFor(day.datetime),
    date: day.datetime,
    high: Math.round(day.tempmax),
    low: Math.round(day.tempmin),
    condition: day.conditions ?? "Unknown",
    icon: day.icon ?? "partly-cloudy-day",
  }));

  const hourlySource = tripDay.hours ?? [];
  const hourly: HourlyForecastEntry[] = HOURLY_SAMPLE_HOURS.map((targetHour) => {
    const match =
      hourlySource.find((hour) => Number(hour.datetime.split(":")[0]) === targetHour) ?? hourlySource[targetHour];
    if (!match) return null;
    return {
      label: formatHourLabel(match.datetime),
      temp: Math.round(match.temp),
      condition: match.conditions ?? "Unknown",
      icon: match.icon ?? "partly-cloudy-day",
    };
  }).filter((entry): entry is HourlyForecastEntry => entry !== null);

  return {
    mode: "forecast",
    city,
    country,
    date: dateStr,
    updatedAt: new Date().toISOString(),
    current: {
      temperature: Math.round(tripDay.temp),
      feelsLike: Math.round(tripDay.feelslike),
      humidity: Math.round(tripDay.humidity),
      windSpeed: Math.round(tripDay.windspeed),
      rainChance: Math.round(tripDay.precipprob ?? 0),
      uvIndex: Math.round(tripDay.uvindex ?? 0),
      uvCategory: categorizeUv(tripDay.uvindex ?? 0),
      condition: tripDay.conditions ?? "Unknown",
      icon: tripDay.icon ?? "partly-cloudy-day",
      sunrise: tripDay.sunrise ?? "--:--",
      sunset: tripDay.sunset ?? "--:--",
    },
    daily,
    hourly,
    alerts: generateAlerts(signals),
    outfit: generateOutfit(signals),
    packing: generatePackingRecommendations(signals),
    summary: generateSummary(city, signals),
    insights: getDestinationInsights(country, data.timezone ?? ""),
  };
}

async function buildClimateResult(
  destination: string,
  dateStr: string,
  apiKey: string
): Promise<ClimateWeatherResult> {
  const targetDate = new Date(`${dateStr}T00:00:00`);

  const historicalDates = HISTORICAL_YEARS_BACK.map((yearsBack) => {
    const pastDate = new Date(targetDate);
    pastDate.setFullYear(targetDate.getFullYear() - yearsBack);
    return toIsoDateString(pastDate);
  });

  const results = await Promise.allSettled(
    historicalDates.map((historicalDate) =>
      fetchVisualCrossing(destination, historicalDate, historicalDate, apiKey, "days")
    )
  );

  const successfulDays: VisualCrossingDay[] = [];
  let resolvedAddress: string | undefined;
  let timezone = "";

  for (const outcome of results) {
    if (outcome.status === "fulfilled" && outcome.value.days?.[0]) {
      successfulDays.push(outcome.value.days[0]);
      if (!resolvedAddress) {
        resolvedAddress = outcome.value.resolvedAddress ?? outcome.value.address;
        timezone = outcome.value.timezone ?? "";
      }
    }
  }

  if (successfulDays.length === 0) {
    throw new Error("VISUAL_CROSSING_NO_HISTORICAL_DATA");
  }

  const average = (selector: (day: VisualCrossingDay) => number) =>
    successfulDays.reduce((sum, day) => sum + selector(day), 0) / successfulDays.length;

  const averageHigh = Math.round(average((day) => day.tempmax));
  const averageLow = Math.round(average((day) => day.tempmin));
  const averageHumidity = Math.round(average((day) => day.humidity ?? 0));
  const averageRainChance = Math.round(average((day) => day.precipprob ?? 0));
  const averageUvIndex = Math.round(average((day) => day.uvindex ?? 0));

  const city = extractCity(resolvedAddress, destination);
  const country = extractCountry(resolvedAddress);

  const signals: ConditionSignals = {
    avgTemp: (averageHigh + averageLow) / 2,
    condition: averageRainChance >= 40 ? "Rain" : "",
    rainChance: averageRainChance,
    humidity: averageHumidity,
    uvIndex: averageUvIndex,
    windSpeed: 0,
  };

  const condition = describeTemperature(signals.avgTemp, averageHumidity);

  return {
    mode: "climate",
    city,
    country,
    month: getMonthName(dateStr),
    averageHigh,
    averageLow,
    averageHumidity,
    averageRainChance,
    averageUvIndex,
    uvCategory: categorizeUv(averageUvIndex),
    condition: `Typical ${condition} weather`,
    outfit: generateOutfit(signals),
    packing: generatePackingRecommendations(signals),
    summary: generateSummary(city, signals),
    insights: getDestinationInsights(country, timezone),
  };
}

/* -------------------------------------------------------------------------- */
/*  Route                                                                      */
/* -------------------------------------------------------------------------- */

router.get("/", requireAuth, async (req: Request, res: ExpressResponse) => {
  const destination = String(req.query.destination ?? "").trim();
  const date = String(req.query.date ?? "").trim();

  if (!destination) {
    return res.status(400).json({ message: "A destination is required for weather clearance." });
  }

  if (!date || !isValidDateString(date)) {
    return res.status(400).json({ message: "A valid date in YYYY-MM-DD format is required." });
  }

  const apiKey = process.env.VISUAL_CROSSING_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ message: "Weather service is not configured. Missing API key." });
  }

  const cacheKey = `${destination.toLowerCase()}_${date}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return res.json(cached.result);
  }

  try {
    const daysUntilTrip = daysBetweenTodayAnd(date);
    const isWithinForecastWindow = daysUntilTrip <= FORECAST_WINDOW_DAYS;

    const result: WeatherResult = isWithinForecastWindow
      ? await buildForecastResult(destination, date, apiKey)
      : await buildClimateResult(destination, date, apiKey);

    weatherCache.set(cacheKey, { result, expiresAt: Date.now() + CACHE_TTL_MS });
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

    if (message === "VISUAL_CROSSING_AUTH_ERROR") {
      return res.status(502).json({ message: "Weather provider rejected the request credentials." });
    }
    if (message === "VISUAL_CROSSING_LOCATION_ERROR") {
      return res.status(404).json({ message: "Destination weather could not be located." });
    }
    if (message === "VISUAL_CROSSING_NO_DATA" || message === "VISUAL_CROSSING_NO_HISTORICAL_DATA") {
      return res.status(502).json({ message: "Weather provider returned no usable data for this trip." });
    }
    return res.status(503).json({ message: "Weather clearance is temporarily unavailable." });
  }
});

export default router;