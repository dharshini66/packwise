import { Plus } from "lucide-react";
import { motion } from "framer-motion";

/* -------------------------------------------------------------------------- */
/*  Types — must match server/src/routes/weather.ts response shape            */
/* -------------------------------------------------------------------------- */

type PackingRecommendation = { item: string; reason: string };
type DailyForecastEntry = { label: string; date: string; high: number; low: number; condition: string; icon: string };
type HourlyForecastEntry = { label: string; temp: number; condition: string; icon: string };
type DestinationInsights = { currency: string; language: string; powerPlug: string; timezone: string; emergencyNumber: string; transportTip: string; weatherTip: string };

export type Weather =
  | {
      mode: "forecast";
      city: string;
      country: string;
      date: string;
      updatedAt: string;
      current: { temperature: number; feelsLike: number; humidity: number; windSpeed: number; rainChance: number; uvIndex: number; uvCategory: string; condition: string; icon: string; sunrise: string; sunset: string };
      daily: DailyForecastEntry[];
      hourly: HourlyForecastEntry[];
      alerts: string[];
      outfit: string[];
      packing: PackingRecommendation[];
      summary: string;
      insights: DestinationInsights;
    }
  | {
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
    };

/* -------------------------------------------------------------------------- */
/*  Icon / emoji mapping                                                      */
/* -------------------------------------------------------------------------- */

const ICON_EMOJI: Record<string, string> = {
  "clear-day": "☀️",
  "clear-night": "🌙",
  "partly-cloudy-day": "🌤",
  "partly-cloudy-night": "☁️",
  cloudy: "☁️",
  rain: "🌧",
  "showers-day": "🌦",
  "showers-night": "🌦",
  "thunder-rain": "⛈",
  "thunder-showers-day": "⛈",
  snow: "❄️",
  "snow-showers-day": "🌨",
  fog: "🌫",
  wind: "🌬",
};
const emojiFor = (icon: string) => ICON_EMOJI[icon] ?? "🌤";

const OUTFIT_EMOJI: Record<string, string> = {
  "t-shirt": "👕",
  shirt: "👕",
  shorts: "🩳",
  sneakers: "👟",
  shoes: "👟",
  boots: "🥾",
  hat: "🧢",
  sunglasses: "🕶",
  jacket: "🧥",
  coat: "🧥",
  sweater: "🧶",
  gloves: "🧤",
  scarf: "🧣",
  socks: "🧦",
  jeans: "👖",
  pants: "👖",
};
const outfitEmoji = (name: string) => {
  const key = Object.keys(OUTFIT_EMOJI).find((candidate) => name.toLowerCase().includes(candidate));
  return key ? OUTFIT_EMOJI[key] : "👔";
};

/* -------------------------------------------------------------------------- */
/*  Root component                                                            */
/* -------------------------------------------------------------------------- */

export default function WeatherDashboard({
  weather,
  error,
  onAdd,
}: {
  weather: Weather | null;
  error: string;
  onAdd: (name: string) => void;
}) {
  if (error) {
    return (
      <section className="border border-[#8b1e3f]/30 bg-[#fbfaf6] p-10 text-center">
        <p className="font-mono text-xs tracking-[.18em] text-[#8b1e3f]">WEATHER CLEARANCE UNAVAILABLE</p>
        <p className="mt-3 text-[#6f4e37]">{error}</p>
      </section>
    );
  }

  if (!weather) {
    return (
      <section className="border border-dashed border-[#b08d57] bg-[#fbfaf6] p-14 text-center">
        <p className="font-mono text-xs tracking-[.18em] text-[#b18c6f]">CONTACTING LOCAL FORECAST DESK…</p>
      </section>
    );
  }

  const handleAddAll = () => {
    weather.packing.forEach((recommendation) => onAdd(recommendation.item));
  };

  return (
    <div className="space-y-8">
      <HeroCard weather={weather} />
      <DetailCards weather={weather} />
      {weather.mode === "forecast" && <FiveDayForecast daily={weather.daily} />}
      {weather.mode === "forecast" && <HourlyForecast hourly={weather.hourly} />}
      {weather.mode === "forecast" && weather.alerts.length > 0 && <Alerts alerts={weather.alerts} />}
      <OutfitCard outfit={weather.outfit} />
      <BoardingRecommendations packing={weather.packing} onAdd={onAdd} onAddAll={handleAddAll} />
      <SummaryCard summary={weather.summary} />
      <DestinationInsightsCard insights={weather.insights} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Hero                                                                       */
/* -------------------------------------------------------------------------- */

function HeroCard({ weather }: { weather: Weather }) {
  const icon = weather.mode === "forecast" ? weather.current.icon : "partly-cloudy-day";
  const temperature = weather.mode === "forecast" ? weather.current.temperature : weather.averageHigh;
  const condition = weather.mode === "forecast" ? weather.current.condition : weather.condition;
  const subtitle =
    weather.mode === "forecast"
      ? `Updated ${new Date(weather.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
      : `Typical for ${weather.month}`;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-sm border border-[#d9cfbd] bg-gradient-to-br from-[#16345a] via-[#1e4066] to-[#24466d] p-8 text-white"
    >
      <p className="font-mono text-[10px] tracking-[.24em] text-[#d6aa62]">WEATHER CLEARANCE</p>
      <div className="mt-4 flex flex-wrap items-center gap-6">
        <span className="text-6xl">{emojiFor(icon)}</span>
        <div>
          <h2 className="font-serif text-4xl">{condition}</h2>
          <p className="mt-1 font-serif text-5xl text-[#d6aa62]">{Math.round(temperature)}°C</p>
        </div>
      </div>
      <p className="mt-5 font-mono text-xs tracking-[.16em] text-white/70">
        {weather.city}
        {weather.country ? `, ${weather.country}` : ""} · {subtitle}
      </p>
    </motion.section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Detail cards                                                              */
/* -------------------------------------------------------------------------- */

function DetailCards({ weather }: { weather: Weather }) {
  const cards =
    weather.mode === "forecast"
      ? [
          { icon: "☀️", label: "Temperature", value: `${weather.current.temperature}°C` },
          { icon: "🌡", label: "Feels Like", value: `${weather.current.feelsLike}°C` },
          { icon: "💧", label: "Humidity", value: `${weather.current.humidity}%` },
          { icon: "🌧", label: "Rain Chance", value: `${weather.current.rainChance}%` },
          { icon: "🌬", label: "Wind", value: `${weather.current.windSpeed} km/h` },
          { icon: "☀", label: "UV Index", value: weather.current.uvCategory },
          { icon: "🌅", label: "Sunrise", value: weather.current.sunrise.slice(0, 5) },
          { icon: "🌇", label: "Sunset", value: weather.current.sunset.slice(0, 5) },
        ]
      : [
          { icon: "☀️", label: "Average High", value: `${weather.averageHigh}°C` },
          { icon: "🌙", label: "Average Low", value: `${weather.averageLow}°C` },
          { icon: "💧", label: "Humidity", value: `${weather.averageHumidity}%` },
          { icon: "🌧", label: "Rain Chance", value: `${weather.averageRainChance}%` },
          { icon: "☀", label: "UV Index", value: weather.uvCategory },
        ];

  return (
    <section>
      <p className="font-mono text-xs tracking-[.18em] text-[#b18c6f]">WEATHER DETAILS</p>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="border border-[#d9cfbd] bg-[#fbfaf6] p-5 text-center">
            <span className="text-2xl">{card.icon}</span>
            <p className="mt-3 font-mono text-[10px] tracking-[.16em] text-[#b18c6f]">{card.label.toUpperCase()}</p>
            <p className="mt-1 font-serif text-2xl text-[#16345a]">{card.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  5-day forecast                                                            */
/* -------------------------------------------------------------------------- */

function FiveDayForecast({ daily }: { daily: DailyForecastEntry[] }) {
  return (
    <section>
      <p className="font-mono text-xs tracking-[.18em] text-[#b18c6f]">5-DAY FORECAST</p>
      <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
        {daily.map((day) => (
          <div key={day.date} className="min-w-[120px] shrink-0 border border-[#d9cfbd] bg-white p-5 text-center">
            <p className="font-mono text-[10px] tracking-[.14em] text-[#b18c6f]">{day.label.toUpperCase()}</p>
            <p className="mt-3 text-2xl">{emojiFor(day.icon)}</p>
            <p className="mt-2 font-serif text-xl text-[#16345a]">{day.high}°</p>
            <p className="font-mono text-xs text-[#b18c6f]">{day.low}°</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Hourly forecast                                                           */
/* -------------------------------------------------------------------------- */

function HourlyForecast({ hourly }: { hourly: HourlyForecastEntry[] }) {
  if (hourly.length === 0) return null;
  return (
    <section>
      <p className="font-mono text-xs tracking-[.18em] text-[#b18c6f]">HOURLY FORECAST</p>
      <div className="mt-4 flex gap-4 overflow-x-auto pb-2 scroll-smooth">
        {hourly.map((hour) => (
          <div key={hour.label} className="min-w-[96px] shrink-0 border border-[#d9cfbd] bg-[#fbfaf6] p-4 text-center">
            <p className="font-mono text-[10px] tracking-[.14em] text-[#b18c6f]">{hour.label}</p>
            <p className="mt-2 text-xl">{emojiFor(hour.icon)}</p>
            <p className="mt-1 font-serif text-lg text-[#16345a]">{hour.temp}°</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Alerts                                                                    */
/* -------------------------------------------------------------------------- */

function Alerts({ alerts }: { alerts: string[] }) {
  return (
    <section className="border border-[#8b1e3f]/30 bg-[#fdf6f2] p-5">
      <p className="font-mono text-xs tracking-[.18em] text-[#8b1e3f]">TRAVEL ADVISORIES</p>
      <ul className="mt-3 space-y-2">
        {alerts.map((alert) => (
          <li key={alert} className="font-serif text-lg text-[#6f4e37]">
            {alert}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Outfit                                                                    */
/* -------------------------------------------------------------------------- */

function OutfitCard({ outfit }: { outfit: string[] }) {
  return (
    <section>
      <p className="font-mono text-xs tracking-[.18em] text-[#b18c6f]">TODAY'S RECOMMENDED OUTFIT</p>
      <div className="mt-4 flex flex-wrap gap-4">
        {outfit.map((piece) => (
          <div key={piece} className="flex items-center gap-3 border border-[#d9cfbd] bg-white px-5 py-4">
            <span className="text-2xl">{outfitEmoji(piece)}</span>
            <span className="font-serif text-lg text-[#16345a]">{piece}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Boarding recommendations                                                  */
/* -------------------------------------------------------------------------- */

function BoardingRecommendations({
  packing,
  onAdd,
  onAddAll,
}: {
  packing: PackingRecommendation[];
  onAdd: (name: string) => void;
  onAddAll: () => void;
}) {
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-xs tracking-[.18em] text-[#b18c6f]">BOARDING RECOMMENDATIONS</p>
        <button
          onClick={onAddAll}
          className="border border-[#b08d57] px-4 py-2 font-mono text-[10px] font-bold tracking-[.14em] text-[#16345a] hover:bg-[#b08d57] hover:text-white"
        >
          + ADD ALL
        </button>
      </div>
      <div className="mt-4 divide-y divide-[#e6e0d4] border border-[#d9cfbd] bg-white">
        {packing.map((recommendation) => (
          <div key={recommendation.item} className="flex items-center justify-between gap-4 px-6 py-4">
            <div>
              <p className="font-serif text-xl text-[#16345a]">{recommendation.item}</p>
              <p className="mt-1 font-mono text-[10px] tracking-[.12em] text-[#b18c6f]">
                REASON: {recommendation.reason.toUpperCase()}
              </p>
            </div>
            <button
              onClick={() => onAdd(recommendation.item)}
              className="flex items-center gap-1 border border-[#16345a] px-3 py-2 text-xs font-bold text-[#16345a] hover:bg-[#16345a] hover:text-white"
            >
              <Plus className="h-3 w-3" /> ADD
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Summary                                                                   */
/* -------------------------------------------------------------------------- */

function SummaryCard({ summary }: { summary: string }) {
  return (
    <section className="border border-[#d9cfbd] bg-[#f7f4ec] p-6">
      <p className="font-mono text-xs tracking-[.18em] text-[#b18c6f]">TRAVEL SUMMARY</p>
      <p className="mt-3 font-serif text-xl leading-relaxed text-[#16345a]">{summary}</p>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Destination insights                                                      */
/* -------------------------------------------------------------------------- */

function DestinationInsightsCard({ insights }: { insights: DestinationInsights }) {
  const rows = [
    { label: "Currency", value: insights.currency },
    { label: "Language", value: insights.language },
    { label: "Power Plug", value: insights.powerPlug },
    { label: "Timezone", value: insights.timezone },
    { label: "Emergency", value: insights.emergencyNumber },
    { label: "Transport Tip", value: insights.transportTip },
    { label: "Local Weather Tip", value: insights.weatherTip },
  ];

  return (
    <section>
      <p className="font-mono text-xs tracking-[.18em] text-[#b18c6f]">DESTINATION INSIGHTS</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="border border-[#d9cfbd] bg-[#fbfaf6] p-5">
            <p className="font-mono text-[10px] tracking-[.16em] text-[#b18c6f]">{row.label.toUpperCase()}</p>
            <p className="mt-1 font-serif text-lg text-[#16345a]">{row.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}