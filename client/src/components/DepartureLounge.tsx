import { useEffect, useMemo, useState, useRef, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Check, Compass, Moon, Sun, Plus, Trash2, X, Banknote, Smartphone, FileText } from "lucide-react";
import { request, type Traveler } from "../lib/api";
import DepartureStamp from "./DepartureStamp";
import WeatherDashboard, { type Weather } from "./WeatherDashboard";

type Item = { id: string; name: string; isStamped: boolean; category?: string };
type Journey = { id: string; title: string; destination: string; origin?: string | null; type: string; departureAt: string; returnAt?: string | null; items: Item[] };
type Blueprint = { id: string; name: string; type: string; items: Item[] };
type Location = { label: string };
const types = ["CITY_BREAK", "BEACH_ESCAPE", "BUSINESS", "ADVENTURE", "INTERNATIONAL", "FAMILY", "CUSTOM", "ROAD_TRIP", "CRUISE", "SKI_TRIP", "SAFARI", "BACKPACKING", "SOLO", "HONEYMOON"];
const label = (value: string) => value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (x: string) => x.toUpperCase());
const code = (destination: string) => destination.replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase().padEnd(3, "TRP");
const flagFor = (destination: string) => { const name = destination.toLowerCase(); if (name.includes("paris") || name.includes("france")) return "🇫🇷"; if (name.includes("tokyo") || name.includes("japan")) return "🇯🇵"; if (name.includes("london") || name.includes("england") || name.includes("uk")) return "🇬🇧"; if (name.includes("new york") || name.includes("usa") || name.includes("america")) return "🇺🇸"; if (name.includes("buenos") || name.includes("argentina")) return "🇦🇷"; if (name.includes("goa") || name.includes("india")) return "🇮🇳"; return "🌍"; };
const imageFor = (destination: string) => {
  const city = destination.toLowerCase();
  if (city.includes("tokyo") || city.includes("japan")) return "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=85";
  if (city.includes("paris") || city.includes("france")) return "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=85";
  if (city.includes("london") || city.includes("england") || city.includes("uk")) return "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=85";
  if (city.includes("new york") || city.includes("usa") || city.includes("america")) return "https://images.unsplash.com/photo-1522083165195-3424ed129620?auto=format&fit=crop&w=1200&q=85";
  if (city.includes("kyoto")) return "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=85";
  if (city.includes("lisbon") || city.includes("portugal")) return "https://images.unsplash.com/photo-1509840841025-9088ba78a826?auto=format&fit=crop&w=1200&q=85";
  if (city.includes("marrakech") || city.includes("morocco")) return "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=1200&q=85";
  if (city.includes("cape town") || city.includes("south africa")) return "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=1200&q=85";
  if (city.includes("reykjavik") || city.includes("iceland")) return "https://images.unsplash.com/photo-1504829857797-ddff28127792?auto=format&fit=crop&w=1200&q=85";
  if (city.includes("havana") || city.includes("cuba")) return "https://images.unsplash.com/photo-1506158669146-619067262a00?auto=format&fit=crop&w=1200&q=85";
  if (city.includes("beach") || city.includes("goa") || city.includes("india")) return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85";
  return "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=85";
};

const journeyTypes = ["CITY_BREAK", "BEACH_ESCAPE", "BUSINESS", "ADVENTURE", "INTERNATIONAL", "FAMILY", "CUSTOM", "ROAD_TRIP", "CRUISE", "SKI_TRIP", "SAFARI", "BACKPACKING", "SOLO", "HONEYMOON"];
const categories = ["OTHER", "DOCUMENTS", "CLOTHING", "ELECTRONICS", "TOILETRIES", "MEDICINE", "ACCESSORIES"];
const pretty = (value: string) => value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter: string) => letter.toUpperCase());
const airportCode = (destination: string) => destination.replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase().padEnd(3, "TRP");

function clearance(journey: Journey) {
  const total = journey.items.length;
  const stamped = journey.items.filter((item) => item.isStamped).length;
  const percent = total ? Math.round((stamped / total) * 100) : 0;
  const remaining = total - stamped;
  
  const departureDate = new Date(journey.departureAt);
  const isClose = Math.max(0, Math.ceil((departureDate.getTime() - Date.now()) / 86400000)) <= 2;
  
  if (percent === 100) {
    return { percent, state: "CLEARED", colour: "green" };
  }
  
  // Trigger attention state if departure is close OR only a few items (1 to 3) remain unstamped
  const fewItemsLeft = remaining > 0 && remaining <= 3;
  if ((isClose || fewItemsLeft) && percent < 100) {
    return { percent, state: "ATTENTION", colour: "red" };
  }
  
  return { percent, state: percent ? "ON TRACK" : "PENDING", colour: percent ? "gold" : "muted" };
}

function FlipTime({ date }: { date: string }) {
  const [value, setValue] = useState(() => new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  useEffect(() => {
    const update = () => setValue(new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [date]);
  return <span className="flip-time" aria-label={value}>{value.split("").map((character, index) => character === ":" ? <i key={index}>:</i> : <motion.b key={`${character}-${index}-${value}`} initial={{ rotateX: -90, opacity: 0.2 }} animate={{ rotateX: 0, opacity: 1 }} transition={{ duration: 0.42, delay: index * 0.045, ease: "easeOut" }}>{character}</motion.b>)}</span>;
}

const PRE_MADE_BLUEPRINTS = [
  {
    id: "pm-beach",
    name: "Beach Escape",
    type: "BEACH_ESCAPE",
    categoryTag: "BEACH & COAST",
    icon: "🏖️",
    description: "Everything you need for sun, sand, and sea. Optimised for warm-weather coastal destinations.",
    tags: ["DOCUMENTS", "CLOTHING", "TOILETRIES", "ACCESSORIES"],
    items: [
      { name: "Passport & Tickets", category: "DOCUMENTS", quantity: 1 },
      { name: "Swimwear", category: "CLOTHING", quantity: 2 },
      { name: "Sunscreen SPF 50", category: "TOILETRIES", quantity: 1 },
      { name: "Beach Towel", category: "ACCESSORIES", quantity: 1 },
      { name: "Sunglasses", category: "ACCESSORIES", quantity: 1 },
      { name: "Light T-Shirts", category: "CLOTHING", quantity: 4 },
      { name: "Shorts", category: "CLOTHING", quantity: 3 },
      { name: "Flip Flops", category: "CLOTHING", quantity: 1 },
      { name: "Hat / Cap", category: "ACCESSORIES", quantity: 1 },
      { name: "After-sun Lotion", category: "TOILETRIES", quantity: 1 },
    ]
  },
  {
    id: "pm-business",
    name: "Business Summit",
    type: "BUSINESS",
    categoryTag: "BUSINESS TRAVEL",
    icon: "💼",
    description: "Professional essentials for conference travel. Presentation-ready from touchdown to keynote.",
    tags: ["DOCUMENTS", "CLOTHING", "ELECTRONICS", "ACCESSORIES"],
    items: [
      { name: "Conference Ticket / ID", category: "DOCUMENTS", quantity: 1 },
      { name: "Laptop & Charger", category: "ELECTRONICS", quantity: 1 },
      { name: "Formal Suit", category: "CLOTHING", quantity: 1 },
      { name: "Ironed Shirts", category: "CLOTHING", quantity: 3 },
      { name: "Notebook & Pen", category: "OTHER", quantity: 1 },
      { name: "Business Cards", category: "OTHER", quantity: 20 },
      { name: "Deodorant", category: "TOILETRIES", quantity: 1 },
      { name: "Phone Charger / Powerbank", category: "ELECTRONICS", quantity: 1 },
      { name: "Smart Shoes", category: "CLOTHING", quantity: 1 },
    ]
  },
  {
    id: "pm-mountain",
    name: "Mountain Trek",
    type: "ADVENTURE",
    categoryTag: "ALPINE & TREKKING",
    icon: "🏔️",
    description: "Layered protection for altitude and terrain. Built for multi-day alpine adventures.",
    tags: ["CLOTHING", "MEDICINE", "ACCESSORIES", "ELECTRONICS"],
    items: [
      { name: "Hiking Boots", category: "CLOTHING", quantity: 1 },
      { name: "Thermal Layers", category: "CLOTHING", quantity: 2 },
      { name: "Windbreaker / Raincoat", category: "CLOTHING", quantity: 1 },
      { name: "First Aid Kit", category: "MEDICINE", quantity: 1 },
      { name: "Compass / GPS Map", category: "ACCESSORIES", quantity: 1 },
      { name: "Water Purification Tablets", category: "MEDICINE", quantity: 1 },
      { name: "Headlamp & Batteries", category: "ELECTRONICS", quantity: 1 },
      { name: "Energy Bars", category: "OTHER", quantity: 6 },
      { name: "Multi-tool Pocket Knife", category: "OTHER", quantity: 1 },
    ]
  },
  {
    id: "pm-city",
    name: "City Explorer",
    type: "CITY_BREAK",
    categoryTag: "URBAN EXPLORER",
    icon: "🏙️",
    description: "Light and agile for urban adventures. Covers culture, gastronomy, and street-level discovery.",
    tags: ["DOCUMENTS", "CLOTHING", "ELECTRONICS", "ACCESSORIES"],
    items: [
      { name: "City Guidebook / Map", category: "DOCUMENTS", quantity: 1 },
      { name: "Comfortable Walking Shoes", category: "CLOTHING", quantity: 1 },
      { name: "Camera & Charger", category: "ELECTRONICS", quantity: 1 },
      { name: "Daypack / Small Bag", category: "ACCESSORIES", quantity: 1 },
      { name: "Credit Cards & Small Cash", category: "DOCUMENTS", quantity: 1 },
      { name: "Hand Sanitizer", category: "TOILETRIES", quantity: 1 },
      { name: "Casual Jackets", category: "CLOTHING", quantity: 1 },
      { name: "Powerbank", category: "ELECTRONICS", quantity: 1 },
    ]
  },
  {
    id: "pm-winter",
    name: "Winter Expedition",
    type: "SKI_TRIP",
    categoryTag: "WINTER EXPEDITION",
    icon: "❄️",
    description: "Full cold-weather coverage for destinations below zero. Layered for the deep cold.",
    tags: ["CLOTHING", "ACCESSORIES", "TOILETRIES", "OTHER"],
    items: [
      { name: "Heavy Down Coat", category: "CLOTHING", quantity: 1 },
      { name: "Woolen Gloves / Mittens", category: "ACCESSORIES", quantity: 2 },
      { name: "Winter Beanie & Scarf", category: "ACCESSORIES", quantity: 1 },
      { name: "Lip Balm (Chapped prevention)", category: "TOILETRIES", quantity: 1 },
      { name: "Thermal Socks", category: "CLOTHING", quantity: 4 },
      { name: "Snow Goggles", category: "ACCESSORIES", quantity: 1 },
      { name: "Hand Warmers", category: "OTHER", quantity: 4 },
    ]
  },
  {
    id: "pm-safari",
    name: "Safari & Wildlife",
    type: "SAFARI",
    categoryTag: "SAFARI & WILDLIFE",
    icon: "🦁",
    description: "Neutral tones and field essentials for wildlife encounters across the African continent.",
    tags: ["CLOTHING", "ACCESSORIES", "DOCUMENTS", "TOILETRIES"],
    items: [
      { name: "Binoculars", category: "ACCESSORIES", quantity: 1 },
      { name: "Insect Repellent Spray", category: "TOILETRIES", quantity: 1 },
      { name: "Khaki / Neutral T-shirts", category: "CLOTHING", quantity: 4 },
      { name: "Wide-brim Safari Hat", category: "ACCESSORIES", quantity: 1 },
      { name: "Vaccination Records / Yellow Card", category: "DOCUMENTS", quantity: 1 },
      { name: "Sunscreen Lotion", category: "TOILETRIES", quantity: 1 },
      { name: "Light Hiking Shoes", category: "CLOTHING", quantity: 1 },
    ]
  },
  {
    id: "pm-cruise",
    name: "Tropical Cruise",
    type: "CRUISE",
    categoryTag: "CRUISE VACATION",
    icon: "🚢",
    description: "Everything you need for sailing the seas. Covers formal nights, pool side relax, and island excursions.",
    tags: ["DOCUMENTS", "CLOTHING", "MEDICINE", "ACCESSORIES"],
    items: [
      { name: "Cruise Boarding Pass & ID", category: "DOCUMENTS", quantity: 1 },
      { name: "Swimwear / Trunks", category: "CLOTHING", quantity: 2 },
      { name: "Formal Dinner Outfit", category: "CLOTHING", quantity: 1 },
      { name: "Sea-sickness wristbands/pills", category: "MEDICINE", quantity: 1 },
      { name: "Sunscreen SPF 30", category: "TOILETRIES", quantity: 1 },
      { name: "Sandals / Boat Shoes", category: "CLOTHING", quantity: 1 },
      { name: "Polarized Sunglasses", category: "ACCESSORIES", quantity: 1 },
      { name: "Excursion Daypack", category: "ACCESSORIES", quantity: 1 },
    ]
  },
  {
    id: "pm-roadtrip",
    name: "Scenic Road Trip",
    type: "ROAD_TRIP",
    categoryTag: "ROAD TRIP",
    icon: "🚗",
    description: "Travel essentials for long highway drives. Optimised for vehicle comfort and overnight stops.",
    tags: ["DOCUMENTS", "ELECTRONICS", "ACCESSORIES", "OTHER"],
    items: [
      { name: "Driver's License & Insurance", category: "DOCUMENTS", quantity: 1 },
      { name: "Car Phone Mount", category: "ACCESSORIES", quantity: 1 },
      { name: "USB Car Charger / Multi-port", category: "ELECTRONICS", quantity: 1 },
      { name: "Offline GPS Maps", category: "DOCUMENTS", quantity: 1 },
      { name: "Travel Pillow & Blanket", category: "OTHER", quantity: 1 },
      { name: "Refillable Water Bottle", category: "OTHER", quantity: 1 },
      { name: "Roadside Emergency Kit", category: "OTHER", quantity: 1 },
      { name: "Snack Box (Nuts, Jerky, Bars)", category: "OTHER", quantity: 1 },
    ]
  },
  {
    id: "pm-backpack",
    name: "Backpacker Explorer",
    type: "BACKPACKING",
    categoryTag: "BACKPACKING TRAVEL",
    icon: "🎒",
    description: "Compact and ultra-light packing for hostels and long journeys across multiple borders.",
    tags: ["DOCUMENTS", "CLOTHING", "ELECTRONICS", "ACCESSORIES"],
    items: [
      { name: "Microfiber Travel Towel", category: "ACCESSORIES", quantity: 1 },
      { name: "Combination Padlocks", category: "ACCESSORIES", quantity: 2 },
      { name: "Universal Travel Adapter", category: "ELECTRONICS", quantity: 1 },
      { name: "Hostel Sleep Sheet / Liner", category: "OTHER", quantity: 1 },
      { name: "Quick-dry Underwear", category: "CLOTHING", quantity: 3 },
      { name: "Solid Shampoo / Soap bar", category: "TOILETRIES", quantity: 1 },
      { name: "Passport Photos (For Visas)", category: "DOCUMENTS", quantity: 4 },
    ]
  }
];

export default function DepartureLounge({ traveler, onSignOut, theme, onToggleTheme }: { traveler: Traveler; onSignOut: () => void; theme: string; onToggleTheme: () => void }) {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [selected, setSelected] = useState<Journey | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [page, setPage] = useState<"lounge" | "blueprints" | "passport">("lounge");
  const [notice, setNotice] = useState("");
  const [imageUrls, setImageUrls] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem("packwise_image_urls") || "{}");
    } catch {
      return {};
    }
  });
  const [insights, setInsights] = useState<Record<string, any>>(() => {
    try {
      return JSON.parse(localStorage.getItem("packwise_insights") || "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem("packwise_image_urls", JSON.stringify(imageUrls));
  }, [imageUrls]);

  useEffect(() => {
    localStorage.setItem("packwise_insights", JSON.stringify(insights));
  }, [insights]);

  const [locations, setLocations] = useState<Location[]>([]);
  const [stamp, setStamp] = useState<Journey | null>(null);

  // Auto-clear update notification notice after 4 seconds
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  // Resolve dynamic Wikipedia images for destinations
  const resolveImage = async (destination: string) => {
    const key = destination.trim();
    if (imageUrls[key] && !imageUrls[key].includes("photo-1488646953014-85cb44e25828")) return;

    const cityLower = key.split(",")[0]?.trim().toLowerCase() || key.toLowerCase();
    
    // Preset image mappings matching imageFor
    const presetImages: Record<string, string> = {
      tokyo: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=85",
      japan: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=85",
      paris: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=85",
      france: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=85",
      london: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=85",
      england: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=85",
      uk: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=85",
      "new york": "https://images.unsplash.com/photo-1522083165195-3424ed129620?auto=format&fit=crop&w=1200&q=85",
      usa: "https://images.unsplash.com/photo-1522083165195-3424ed129620?auto=format&fit=crop&w=1200&q=85",
      america: "https://images.unsplash.com/photo-1522083165195-3424ed129620?auto=format&fit=crop&w=1200&q=85",
      kyoto: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=85",
      lisbon: "https://images.unsplash.com/photo-1509840841025-9088ba78a826?auto=format&fit=crop&w=1200&q=85",
      portugal: "https://images.unsplash.com/photo-1509840841025-9088ba78a826?auto=format&fit=crop&w=1200&q=85",
      marrakech: "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=1200&q=85",
      morocco: "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=1200&q=85",
      "cape town": "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=1200&q=85",
      "south africa": "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=1200&q=85",
      reykjavik: "https://images.unsplash.com/photo-1504829857797-ddff28127792?auto=format&fit=crop&w=1200&q=85",
      iceland: "https://images.unsplash.com/photo-1504829857797-ddff28127792?auto=format&fit=crop&w=1200&q=85",
      havana: "https://images.unsplash.com/photo-1506158669146-619067262a00?auto=format&fit=crop&w=1200&q=85",
      cuba: "https://images.unsplash.com/photo-1506158669146-619067262a00?auto=format&fit=crop&w=1200&q=85",
      beach: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85",
      goa: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85",
      india: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85",
    };

    let presetUrl = "";
    for (const prefix in presetImages) {
      if (cityLower.includes(prefix)) {
        presetUrl = presetImages[prefix];
        break;
      }
    }

    if (presetUrl) {
      setImageUrls((prev) => ({ ...prev, [key]: presetUrl }));
      return;
    }

    try {
      const res = await request<{ url: string }>(`/images?query=${encodeURIComponent(key)}`, { headers: auth });
      if (res.url) {
        setImageUrls((prev) => ({ ...prev, [key]: res.url }));
      } else {
        setImageUrls((prev) => ({ ...prev, [key]: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=85" }));
      }
    } catch {
      setImageUrls((prev) => ({ ...prev, [key]: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=85" }));
    }
  };

  // Resolve dynamic country insights for destination
  const resolveInsights = async (destination: string, origin?: string | null) => {
    const key = destination.trim();
    if (insights[key]) return;
    const originParam = origin ? `&origin=${encodeURIComponent(origin.trim())}` : "";
    try {
      const res = await request<any>(`/insights?destination=${encodeURIComponent(key)}${originParam}`, { headers: auth });
      setInsights((prev) => ({ ...prev, [key]: res }));
    } catch {
      setInsights((prev) => ({
        ...prev,
        [key]: {
          currencyCode: "USD",
          currencyName: "United States Dollar",
          entryClearance: "Valid passport required. Standard border clearance.",
          connectivity: "Confirm mobile roaming options before departure.",
          notes: "“Itinerary saved. Travel clearance confirmed.”"
        }
      }));
    }
  };

  const handlePreFetchDestination = (destination: string, origin?: string | null) => {
    void resolveImage(destination);
    void resolveInsights(destination, origin);
  };

  useEffect(() => {
    journeys.forEach((journey) => {
      void resolveImage(journey.destination);
      void resolveInsights(journey.destination, journey.origin);
    });
  }, [journeys]);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("date");

  const auth = { Authorization: `Bearer ${localStorage.getItem("packwise_token")}` };

  const refresh = async () => {
    try {
      const [journeyData, blueprintData] = await Promise.all([
        request<{ journeys: Journey[] }>("/journeys", { headers: auth }),
        request<{ blueprints: Blueprint[] }>("/blueprints", { headers: auth }),
      ]);
      setJourneys(journeyData.journeys);
      setBlueprints(blueprintData.blueprints);
    } catch { setNotice("Unable to connect to the departure desk."); }
  };
  useEffect(() => { void refresh(); }, []);

  const active = useMemo(() => {
    const upcoming = journeys.filter((journey) => new Date(journey.departureAt) >= new Date());
    return upcoming
      .filter((j) => {
        const matchesSearch = j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              j.destination.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === "ALL" || j.type === typeFilter;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        if (sortBy === "date") return +new Date(a.departureAt) - +new Date(b.departureAt);
        if (sortBy === "title") return a.title.localeCompare(b.title);
        if (sortBy === "clearance") {
          const clearanceA = clearance(a).percent;
          const clearanceB = clearance(b).percent;
          return clearanceB - clearanceA;
        }
        return 0;
      });
  }, [journeys, searchQuery, typeFilter, sortBy]);
  const completed = journeys.filter((journey) => journey.items.length > 0 && journey.items.every((item) => item.isStamped));
  const totalItems = journeys.reduce((total, journey) => total + journey.items.length, 0);
  const packed = journeys.reduce((total, journey) => total + journey.items.filter((item) => item.isStamped).length, 0);
  const days = active[0] ? Math.max(0, Math.ceil((+new Date(active[0].departureAt) - Date.now()) / 86400000)) : 0;

  const handleCreateJourney = async (values: { title: string; destination: string; type: string; departureAt: string; returnAt?: string | null; blueprintId?: string }) => {
    try {
      await request("/journeys", { method: "POST", headers: auth, body: JSON.stringify(values) });
      setShowNew(false); setNotice("Journey added to the departure board."); await refresh();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to create journey."); }
  };
  const addItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!selected) return; const form = new FormData(event.currentTarget);
    try { await request(`/journeys/${selected.id}/items`, { method: "POST", headers: auth, body: JSON.stringify({ name: form.get("name"), category: form.get("category"), quantity: 1 }) }); (event.target as HTMLFormElement).reset(); await refresh(); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Unable to add the travel item."); }
  };
  const quickAddItem = async (name: string) => {
    if (!selected) return;
    try {
      await request(`/journeys/${selected.id}/items`, { method: "POST", headers: auth, body: JSON.stringify({ name, category: "OTHER", quantity: 1 }) });
      setNotice(`${name} added to your manifest.`); await refresh();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to add this suggestion."); }
  };
  const toggleItem = async (item: Item) => {
    if (!selected) return;
    const finalItem = !item.isStamped && selected.items.length > 0 && selected.items.every((candidate) => candidate.id === item.id || candidate.isStamped);
    await request(`/journeys/${selected.id}/items/${item.id}`, { method: "PATCH", headers: auth, body: JSON.stringify({ isStamped: !item.isStamped }) });
    await refresh(); if (finalItem) setStamp(selected);
  };
  const removeItem = async (item: Item) => {
    if (!selected || !window.confirm(`Remove ${item.name} from this manifest?`)) return;
    await request(`/journeys/${selected.id}/items/${item.id}`, { method: "DELETE", headers: auth }); await refresh();
  };
  const removeJourney = async () => {
    if (!selected || !window.confirm(`Remove “${selected.title}”? This cannot be undone.`)) return;
    const targetId = selected.id;
    const previousJourneys = [...journeys];

    // Optimistic Update: close details modal and remove card from list instantly
    setSelected(null);
    setJourneys((prev) => prev.filter((j) => j.id !== targetId));

    try {
      await request(`/journeys/${targetId}`, { method: "DELETE", headers: auth });
      await refresh();
    } catch (error) {
      setJourneys(previousJourneys);
      setNotice(error instanceof Error ? error.message : "Unable to remove journey.");
      await refresh();
    }
  };
  const saveBlueprint = async (journeyId: string) => {
    const name = window.prompt("Name this blueprint:");
    if (!name || !name.trim()) return;
    try {
      await request(`/blueprints/from-journey/${journeyId}`, { method: "POST", headers: auth, body: JSON.stringify({ name: name.trim() }) });
      setNotice("Blueprint saved and ready for future journeys.");
      await refresh();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to save blueprint."); }
  };
  const renameBlueprint = async (blueprint: Blueprint) => {
    const name = window.prompt("Rename blueprint:", blueprint.name);
    if (!name || !name.trim() || name.trim() === blueprint.name) return;
    try {
      const { blueprint: updated } = await request<{ blueprint: Blueprint }>(`/blueprints/${blueprint.id}`, { method: "PATCH", headers: auth, body: JSON.stringify({ name: name.trim() }) });
      setBlueprints((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setNotice("Blueprint renamed.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to rename blueprint."); }
  };
  const deleteBlueprint = async (blueprint: Blueprint) => {
    if (!window.confirm(`Remove blueprint "${blueprint.name}"? This cannot be undone.`)) return;
    try {
      await request(`/blueprints/${blueprint.id}`, { method: "DELETE", headers: auth });
      setBlueprints((prev) => prev.filter((item) => item.id !== blueprint.id));
      setNotice("Blueprint removed.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to remove blueprint."); }
  };
  const applyBlueprint = async (blueprintId: string, journeyId: string) => {
    try {
      const result = await request<{ message: string }>(`/blueprints/${blueprintId}/apply/${journeyId}`, { method: "POST", headers: auth });
      setNotice(result.message);
      await refresh();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to apply blueprint."); }
  };

  return <div className="min-h-screen bg-[#f5f1e8] text-[#16345a] dark:bg-[#0b132b] dark:text-[#eee6d7] transition-colors duration-300">
    <Header page={page} setPage={setPage} onNew={() => setShowNew(true)} onSignOut={onSignOut} theme={theme} onToggleTheme={onToggleTheme} />
    {notice && <button onClick={() => setNotice("")} className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#16345a] px-5 py-3 text-sm text-white shadow-xl">{notice}</button>}
    {page === "lounge" && <>
      <section className="board-shell"><div className="mx-auto max-w-[1560px] px-5 py-9"><div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="font-serif text-4xl text-white">Departure Lounge</h1><p className="mt-1 font-mono text-xs tracking-[.2em] text-[#c19c5b]">GATE STATUS · ALL TERMINALS</p></div><div className="flex flex-wrap gap-4 text-[10px] font-mono tracking-[.15em] text-white/50"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#10B981]" /> CLEARED</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#B08A4A]" /> ON TRACK</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#EF4444]" /> ATTENTION</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#6B7280]" /> PENDING</span></div></div><div className="mt-9 overflow-auto"><div className="min-w-[760px]"><div className="board-row board-label"><span>DESTINATION</span><span>TIME</span><span>STATUS</span><span>FLIGHT</span><span>GATE</span></div>{active.slice(0, 5).map((journey) => { const status = clearance(journey); return <button onClick={() => setSelected(journey)} key={journey.id} className="board-row board-flight"><b>{journey.destination.toUpperCase()}</b><FlipTime date={journey.departureAt} /><span className={status.colour}>{status.state}</span><span>PW {journey.id.slice(-3).toUpperCase()}</span><span>{airportCode(journey.destination)}2</span></button>; })}{!active.length && <p className="py-10 text-center font-mono text-sm text-white/55">NO JOURNEYS ON THE BOARD — CREATE YOUR FIRST DEPARTURE</p>}</div></div></div></section>
      <section className="border-b border-[#d9cfbd] bg-[#f7f4ec] dark:bg-[#101c2e] dark:border-white/10"><div className="mx-auto grid max-w-[1100px] grid-cols-2 gap-8 px-5 py-7 text-center sm:grid-cols-4"><Stat value={String(active.length)} label="ACTIVE JOURNEYS" /><Stat value={`${days} days`} label="DAYS TO DEPARTURE" /><Stat value={`${packed} / ${totalItems}`} label="ITEMS STAMPED" /><Stat value={`${totalItems ? Math.round((packed / totalItems) * 100) : 0}%`} label="OVERALL CLEARANCE" /></div></section>

      {/* Search and Filters Bar */}
      <section className="border-b border-[#d9cfbd] bg-[#fbfaf7] dark:bg-[#132238] dark:border-white/10 px-5 py-4">
        <div className="mx-auto max-w-[1500px] flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search journeys by destination or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 border border-[#d9cfbd] bg-white dark:bg-[#101c2e] dark:border-white/10 dark:text-[#eee6d7] text-sm w-full md:w-80 outline-none focus:border-passport dark:focus:border-gold"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-[#d9cfbd] bg-white dark:bg-[#101c2e] dark:border-white/10 dark:text-[#eee6d7] text-sm outline-none focus:border-passport dark:focus:border-gold"
            >
              <option value="ALL">All Journey Types</option>
              {journeyTypes.map((t) => <option key={t} value={t}>{pretty(t)}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            <span className="text-xs font-bold text-[#b18c6f]">SORT BY</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-[#d9cfbd] bg-white dark:bg-[#101c2e] dark:border-white/10 dark:text-[#eee6d7] text-sm outline-none focus:border-passport dark:focus:border-gold"
            >
              <option value="date">Departure Date</option>
              <option value="title">Journey Title</option>
              <option value="clearance">Clearance Status</option>
            </select>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1500px] px-5 py-14"><div className="flex items-end justify-between"><div><h2 className="font-serif text-3xl">Your Journeys</h2><p className="mt-2 font-mono text-xs tracking-[.15em] text-[#b18c6f]">{active.length} UPCOMING · SORTED BY DEPARTURE</p></div></div>{active.length ? <div className="mt-10 grid gap-7 md:grid-cols-2 xl:grid-cols-3">{active.map((journey) => <JourneyCard journey={journey} key={journey.id} onOpen={() => setSelected(journey)} imageUrl={imageUrls[journey.destination] || imageFor(journey.destination)} />)}</div> : <EmptyState onNew={() => setShowNew(true)} />}</main>
    </>}
    {page === "blueprints" && <Blueprints blueprints={blueprints} onRename={renameBlueprint} onDelete={deleteBlueprint} journeys={journeys} onApplyBlueprint={applyBlueprint} refresh={refresh} auth={auth} />}
    {page === "passport" && <Passport traveler={traveler} journeys={completed} imageUrls={imageUrls} />}
    {showNew && <NewJourney blueprints={blueprints} onClose={() => setShowNew(false)} onCreate={handleCreateJourney} auth={auth} onResolveImage={handlePreFetchDestination} />}
    {selected && <JourneyDetail journey={journeys.find((journey) => journey.id === selected.id) ?? selected} onClose={() => setSelected(null)} onAddItem={addItem} onQuickAdd={quickAddItem} onToggle={toggleItem} onRemoveItem={removeItem} onRemoveJourney={removeJourney} onSaveBlueprint={saveBlueprint} blueprints={blueprints} onApplyBlueprint={applyBlueprint} auth={auth} imageUrl={imageUrls[selected.destination] || imageFor(selected.destination)} insightsData={insights[selected.destination]} />}
    {stamp && <DepartureStamp destination={stamp.destination} onClose={() => { setStamp(null); setSelected(null); setPage("passport"); }} />}
  </div>;
}

function Header({ page, setPage, onNew, onSignOut, theme, onToggleTheme }: { page: "lounge" | "blueprints" | "passport"; setPage: (page: "lounge" | "blueprints" | "passport") => void; onNew: () => void; onSignOut: () => void; theme: string; onToggleTheme: () => void }) {
  return <><header className="border-y-4 border-[#8b1e3f] bg-[#24466d] text-white"><div className="mx-auto flex h-[84px] max-w-[1560px] items-center justify-between px-5"><button onClick={() => setPage("lounge")} className="flex items-center gap-4"><span className="grid h-11 w-11 place-items-center rounded-sm bg-[#b08d57] text-xl">◉</span><span className="text-left"><b className="font-serif text-xl tracking-[.16em]">PACKWISE</b><small className="block text-[10px] tracking-[.28em] text-[#d6aa62]">READY FOR DEPARTURE</small></span></button><nav className="hidden gap-3 md:flex">{(["lounge", "blueprints", "passport"] as const).map((key) => <button key={key} onClick={() => setPage(key)} className={`nav-tab ${page === key ? "active" : ""}`}>{key === "lounge" ? "▱ DEPARTURE LOUNGE" : key === "blueprints" ? "▰ TRAVEL BLUEPRINTS" : "◌ MY PASSPORT"}</button>)}</nav><div className="flex items-center gap-4"><button onClick={onNew} className="hidden bg-[#b08d57] px-5 py-3 text-xs font-bold tracking-[.16em] text-[#102841] sm:block">＋ NEW JOURNEY</button><button onClick={onToggleTheme} aria-label="Toggle Theme" className="p-1.5 rounded-full hover:bg-white/10 text-white transition">{theme === "dark" ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-white/60" />}</button><button onClick={onSignOut} className="text-xs text-white/70">SIGN OUT</button></div></div></header><nav className="grid grid-cols-3 border-b border-[#d9cfbd] bg-[#f8f6f0] dark:bg-[#132238] dark:border-white/10 md:hidden">{(["lounge", "blueprints", "passport"] as const).map((key) => <button key={key} onClick={() => setPage(key)} className={`mobile-nav ${page === key ? "active" : ""}`}>{key.toUpperCase()}</button>)}</nav></>;
}
function Stat({ value, label }: { value: string; label: string }) { return <div><b className="font-serif text-4xl text-[#b08d57]">{value}</b><p className="mt-2 font-mono text-[10px] tracking-[.18em] text-[#b18c6f]">{label}</p></div>; }
function EmptyState({ onNew }: { onNew: () => void }) { return <div className="mt-10 grid place-items-center border border-dashed border-[#b08d57] p-16 text-center"><Compass className="h-9 w-9 text-[#b08d57]" /><h3 className="mt-4 font-serif text-2xl">Your passport is waiting for its first stamp.</h3><button onClick={onNew} className="mt-5 bg-[#b08d57] px-5 py-3 text-xs font-bold tracking-wider">PLAN A JOURNEY</button></div>; }
const getProgressBarColor = (state: string) => {
  if (state === "CLEARED") return "#10B981";
  if (state === "ON TRACK") return "#B08A4A";
  if (state === "ATTENTION") return "#EF4444";
  return "#6B7280"; // PENDING
};

function JourneyCard({ journey, onOpen, imageUrl }: { journey: Journey; onOpen: () => void; imageUrl: string }) {
  const status = clearance(journey);
  return (
    <motion.button whileHover={{ y: -5 }} onClick={onOpen} className="journey-photo-card text-left">
      <img src={imageUrl} alt={journey.destination} />
      <div className="photo-overlay" />
      <span className="flight-tag">✈ PW {journey.id.slice(-3).toUpperCase()}</span>
      <span className={`status-tag ${status.colour}`}>{status.state}</span>
      <div className="absolute bottom-28 left-6 text-white">
        <h3 className="font-serif text-4xl">{journey.title}</h3>
        <p className="mt-1 font-mono text-sm">{flagFor(journey.destination)} {journey.destination} · {pretty(journey.type)}</p>
      </div>
      <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-2.5 px-6 py-[18px] bg-[#fffdf8] dark:bg-[#132238] text-[#16345a] dark:text-[#eee6d7] border-t border-slate-100 dark:border-white/5">
        <div className="flex justify-between items-end w-full">
          <span>
            <small className="text-[10px] font-mono tracking-wider text-[#a68164] dark:text-white/45 block mb-0.5">◷ DEPARTURE</small>
            <b className="text-sm font-sans tracking-wide">{new Date(journey.departureAt).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}</b>
          </span>
          <span className="text-right">
            <b className="font-serif text-3xl text-[#b08d57] dark:text-gold block leading-none mb-0.5">{status.percent}%</b>
            <small className="text-[10px] font-mono tracking-wider text-[#a68164] dark:text-white/45 block font-bold">CLEARANCE</small>
          </span>
        </div>
        <div className="w-full bg-[#f0ece1] dark:bg-slate-800/50 h-1.5 rounded-full overflow-hidden mt-1">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${status.percent}%`, backgroundColor: getProgressBarColor(status.state) }}
          />
        </div>
      </div>
    </motion.button>
  );
}
function Blueprints({
  blueprints,
  onRename,
  onDelete,
  journeys,
  onApplyBlueprint,
  refresh,
  auth
}: {
  blueprints: Blueprint[];
  onRename: (blueprint: Blueprint) => void;
  onDelete: (blueprint: Blueprint) => void;
  journeys: Journey[];
  onApplyBlueprint: (blueprintId: string, journeyId: string) => void;
  refresh: () => Promise<void>;
  auth: Record<string, string>;
}) {
  const [filter, setFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewBp, setPreviewBp] = useState<any | null>(null);
  const [applyBp, setApplyBp] = useState<any | null>(null);
  const [targetJourneyId, setTargetJourneyId] = useState("");
  
  // Custom blueprint creation state
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createType, setCreateType] = useState("CUSTOM");

  const filterKeys = [
    { key: "ALL", label: "ALL BLUEPRINTS", emoji: "" },
    { key: "BEACH", label: "BEACH", emoji: "🏖️ " },
    { key: "BUSINESS", label: "BUSINESS", emoji: "💼 " },
    { key: "MOUNTAIN", label: "MOUNTAIN", emoji: "🏔️ " },
    { key: "CITY", label: "CITY", emoji: "🏙️ " },
    { key: "WINTER", label: "WINTER", emoji: "❄️ " },
    { key: "SAFARI", label: "SAFARI", emoji: "🦁 " },
    { key: "ROAD_TRIP", label: "ROAD TRIP", emoji: "🚗 " },
    { key: "CRUISE", label: "CRUISE", emoji: "🚢 " },
    { key: "BACKPACKING", label: "BACKPACKING", emoji: "🎒 " }
  ] as const;

  // Combine static and custom blueprints
  const allBlueprints = useMemo(() => {
    // Filter out seeded blueprints from the backend list to avoid duplicates
    const customUserBlueprints = blueprints.filter(bp => !bp.id.startsWith("pm-"));
    return [
      ...PRE_MADE_BLUEPRINTS,
      ...customUserBlueprints.map((bp) => ({
        id: bp.id,
        name: bp.name,
        type: bp.type,
        categoryTag: "CUSTOM ITINERARY",
        icon: "📋",
        description: "Your custom saved travel blueprint.",
        tags: ["CLOTHING", "OTHER"],
        items: bp.items,
      })),
    ];
  }, [blueprints]);

  const getBlueprintSearchText = (bp: any) => {
    const name = bp.name.toLowerCase();
    const desc = bp.description.toLowerCase();
    const type = bp.type.toLowerCase();
    const tags = bp.tags.map((t: string) => t.toLowerCase()).join(" ");
    
    // Add synonyms/aliases based on type
    let aliases = "";
    if (bp.type === "CITY_BREAK") aliases = "city escape break urban explorer town";
    if (bp.type === "BEACH_ESCAPE") aliases = "beach coast sea sun escape water";
    if (bp.type === "ADVENTURE") aliases = "mountain trek hiking adventure wilderness climb";
    if (bp.type === "BUSINESS") aliases = "business work conference summit meeting professional";
    if (bp.type === "ROAD_TRIP") aliases = "road trip scenic drive highway highway car";
    if (bp.type === "CRUISE") aliases = "cruise ship ocean sailing sea tropical boat";
    if (bp.type === "BACKPACKING") aliases = "backpack backpacking hostel budget explorer light";
    
    return `${name} ${desc} ${type} ${tags} ${aliases}`;
  };

  // Filter list
  const filtered = useMemo(() => {
    return allBlueprints.filter((bp) => {
      // 1. Category Filter Check
      let matchesCategory = true;
      if (filter !== "ALL") {
        const type = String(bp.type || "").toUpperCase();
        const name = String(bp.name || "").toUpperCase();
        const id = String(bp.id || "");

        if (filter === "BEACH") {
          matchesCategory = type === "BEACH_ESCAPE" || id === "pm-beach" || name.includes("BEACH");
        } else if (filter === "BUSINESS") {
          matchesCategory = type === "BUSINESS" || id === "pm-business" || name.includes("BUSINESS");
        } else if (filter === "MOUNTAIN") {
          matchesCategory = type === "ADVENTURE" || id === "pm-mountain" || name.includes("MOUNTAIN") || name.includes("TREK");
        } else if (filter === "CITY") {
          matchesCategory = type === "CITY_BREAK" || id === "pm-city" || name.includes("CITY");
        } else if (filter === "WINTER") {
          matchesCategory = id === "pm-winter" || name.includes("WINTER") || name.includes("SNOW") || type === "SKI_TRIP";
        } else if (filter === "SAFARI") {
          matchesCategory = id === "pm-safari" || name.includes("SAFARI") || name.includes("WILDLIFE") || type === "SAFARI";
        } else if (filter === "ROAD_TRIP") {
          matchesCategory = id === "pm-roadtrip" || name.includes("ROAD") || type === "ROAD_TRIP";
        } else if (filter === "CRUISE") {
          matchesCategory = id === "pm-cruise" || name.includes("CRUISE") || type === "CRUISE";
        } else if (filter === "BACKPACKING") {
          matchesCategory = id === "pm-backpack" || name.includes("BACKPACK") || type === "BACKPACKING";
        } else {
          matchesCategory = false;
        }
      }

      // 2. Search Query Check
      let matchesSearch = true;
      if (searchQuery.trim()) {
        const searchText = getBlueprintSearchText(bp);
        const queryKeywords = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
        matchesSearch = queryKeywords.every(kw => searchText.includes(kw));
      }

      return matchesCategory && matchesSearch;
    });
  }, [allBlueprints, filter, searchQuery]);

  const handleApply = (bp: any) => {
    const upcoming = journeys.filter((j) => new Date(j.departureAt) >= new Date());
    if (!upcoming.length) {
      alert("No active journeys found. Please plan a journey first.");
      return;
    }
    setApplyBp(bp);
    setTargetJourneyId(upcoming[0].id);
  };

  const executeApply = () => {
    if (!applyBp || !targetJourneyId) return;
    onApplyBlueprint(applyBp.id, targetJourneyId);
    setApplyBp(null);
  };

  const handleCreateBlueprintSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;
    try {
      await request("/blueprints", {
        method: "POST",
        headers: auth,
        body: JSON.stringify({
          name: createName.trim(),
          type: createType,
          items: [{ name: "Passport", category: "DOCUMENTS", quantity: 1 }]
        })
      });
      setShowCreate(false);
      setCreateName("");
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unable to create custom blueprint.");
    }
  };

  // Card accent top border color resolver
  const cardAccentBorder = (type: string, id: string) => {
    if (type === "BEACH_ESCAPE") return "border-t-4 border-amber-400";
    if (type === "BUSINESS") return "border-t-4 border-purple-400";
    if (type === "ADVENTURE") return "border-t-4 border-emerald-400";
    if (type === "CITY_BREAK") return "border-t-4 border-[#b08d57]";
    if (id === "pm-winter" || type === "SKI_TRIP") return "border-t-4 border-sky-400";
    if (id === "pm-safari" || type === "SAFARI") return "border-t-4 border-amber-800";
    if (id === "pm-roadtrip" || type === "ROAD_TRIP") return "border-t-4 border-orange-400";
    if (id === "pm-cruise" || type === "CRUISE") return "border-t-4 border-cyan-400";
    if (id === "pm-backpack" || type === "BACKPACKING") return "border-t-4 border-rose-400";
    return "border-t-4 border-slate-300";
  };

  return (
    <>
      {/* Sub-header banner */}
      <section className="bg-terminal text-white py-12 px-5 border-b-4 border-passport">
        <div className="mx-auto max-w-[1560px] flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="font-serif text-5xl">Travel Blueprints</h1>
            <p className="mt-2 font-mono text-xs tracking-[.2em] text-[#d6aa62]">
              REUSABLE PACKING TEMPLATES · {allBlueprints.length} BLUEPRINTS AVAILABLE
            </p>
          </div>
          <p className="font-serif italic text-white/80 max-w-sm text-left md:text-right text-sm">
            "A well-packed bag is the mark of a seasoned traveller."
          </p>
        </div>
      </section>

      {/* Filters menu with search input */}
      <div className="border-b border-[#d9cfbd] bg-[#fbfaf7] px-5 py-4 dark:bg-[#132238] dark:border-white/10">
        <div className="mx-auto max-w-[1560px] flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-bold text-slate-400 mr-2 tracking-wider">FILTER:</span>
            {filterKeys.map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key)}
                className={`px-4 py-2 text-xs font-bold tracking-wider rounded-sm transition ${
                  filter === item.key
                    ? "bg-[#b08d57] text-[#102841] dark:bg-gold"
                    : "border border-[#d9cfbd] bg-white dark:bg-[#101c2e] dark:border-white/10 dark:text-[#eee6d7] text-[#16345a] hover:bg-slate-50 dark:hover:bg-[#132238]"
                }`}
              >
                {item.emoji}{item.label}
              </button>
            ))}
          </div>

          <div className="w-full md:w-auto">
            <input
              type="text"
              placeholder="Search blueprints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 border border-[#d9cfbd] bg-white dark:bg-[#101c2e] dark:border-white/10 dark:text-[#eee6d7] text-sm w-full md:w-64 outline-none focus:border-passport dark:focus:border-gold rounded-md"
            />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1560px] px-5 py-14">
        <div className="grid gap-7 md:grid-cols-2">
          {filtered.map((bp) => (
            <article
              className={`relative border border-[#d9cfbd] bg-white dark:bg-[#132238] dark:border-white/10 p-6 flex flex-col justify-between shadow-sm min-h-[220px] rounded-lg ${cardAccentBorder(bp.type, bp.id)}`}
              key={bp.id}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-1.5 bg-slate-50 dark:bg-[#101c2e] rounded-lg border border-slate-100 dark:border-white/5">{bp.icon}</span>
                    <div>
                      <h2 className="font-serif text-2xl text-[#16345a] dark:text-[#eee6d7] font-semibold">{bp.name}</h2>
                    </div>
                  </div>
                  <span className="bg-[#b08d57]/15 dark:bg-gold/15 text-[#b08d57] dark:text-gold px-2 py-1 text-[10px] font-bold tracking-wider uppercase rounded-sm">
                    {bp.categoryTag}
                  </span>
                </div>
                <p className="mt-4 text-sm text-slate-500 dark:text-[#eee6d7]/70 leading-relaxed text-left">{bp.description}</p>
                <div className="mt-4 flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-bold text-[#b18c6f]">★ {bp.items.length} items</span>
                  <span className="text-slate-300 dark:text-white/10">|</span>
                  {bp.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-slate-100 dark:bg-[#101c2e] text-slate-500 dark:text-[#eee6d7]/60 px-2 py-0.5 text-[9px] font-bold tracking-wider rounded-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleApply(bp)}
                    className="flex-1 sm:flex-initial px-5 py-2.5 bg-[#b08d57] text-[#16345a] font-bold text-xs tracking-wider rounded-md hover:opacity-90 transition"
                  >
                    APPLY TO JOURNEY
                  </button>
                  <button
                    onClick={() => setPreviewBp(bp)}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-[#101c2e] border border-slate-200 dark:border-white/5 text-[#16345a] dark:text-[#eee6d7] font-bold text-xs tracking-wider rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                  >
                    ⌄ PREVIEW
                  </button>
                </div>
                
                {!bp.id.startsWith("pm-") && (
                  <div className="flex gap-3 text-xs">
                    <button
                      onClick={() => onRename(bp as any)}
                      className="text-[#16345a] dark:text-[#eee6d7] font-bold hover:underline"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => onDelete(bp as any)}
                      className="text-[#8b1e3f] font-bold hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
          
          {!filtered.length && (
            <p className="col-span-full py-12 text-center text-slate-500 font-serif">
              No blueprints found.
            </p>
          )}
        </div>

        {/* Custom Blueprint Card */}
        <div className="mt-12 border border-dashed border-[#b08d57] p-8 text-center bg-[#fbfaf7] dark:bg-[#132238]/40 rounded-xl flex flex-col items-center justify-center">
          <span className="text-2xl mb-2 text-[#b08d57]">✦</span>
          <h3 className="font-serif text-2xl text-[#16345a] dark:text-[#eee6d7] font-semibold">Create a Custom Blueprint</h3>
          <p className="text-sm text-slate-500 mt-2 mb-5">Build a reusable template from your own travel experience.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-[#b08d57]/10 border border-[#b08d57] text-[#16345a] dark:text-gold px-6 py-2.5 text-xs font-bold tracking-wider rounded-md hover:bg-[#b08d57]/20 transition"
          >
            + NEW BLUEPRINT
          </button>
        </div>
      </main>

      {/* Preview Items Modal */}
      {previewBp && (
        <div className="modal">
          <div className="modal-card w-full max-w-md rounded-xl border border-leather/20 dark:border-white/10 bg-[#fffdf8] dark:bg-[#132238] p-7 shadow-passport text-[#1e3a5f] dark:text-[#eee6d7]">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-serif text-2xl">{previewBp.name} Items</h3>
              <button
                type="button"
                onClick={() => setPreviewBp(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
              {previewBp.items.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex justify-between items-center py-2 px-3 border-b border-slate-100 dark:border-white/5 text-sm"
                >
                  <span className="font-medium text-left">{item.name}</span>
                  <span className="text-xs bg-[#b08d57]/10 text-[#b08d57] px-2 py-0.5 rounded font-mono">
                    Qty: {item.quantity} · {pretty(item.category || "OTHER")}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setPreviewBp(null)}
              className="mt-6 w-full rounded-xl bg-passport dark:bg-gold dark:text-[#102841] text-white py-2.5 font-bold"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Apply to Journey selection Modal */}
      {applyBp && (
        <div className="modal">
          <div className="modal-card w-full max-w-md rounded-xl border border-leather/20 dark:border-white/10 bg-[#fffdf8] dark:bg-[#132238] p-7 shadow-passport text-[#1e3a5f] dark:text-[#eee6d7]">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-serif text-2xl">Apply to Journey</h3>
              <button
                type="button"
                onClick={() => setApplyBp(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4 text-left">
              Select which upcoming journey you want to copy the {applyBp.name} manifest to:
            </p>
            <select
              value={targetJourneyId}
              onChange={(e) => setTargetJourneyId(e.target.value)}
              className="input rounded-xl border border-leather/20 dark:border-white/15 bg-parchment dark:bg-[#101c2e]"
            >
              {journeys
                .filter((j) => new Date(j.departureAt) >= new Date())
                .map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.destination})
                  </option>
                ))}
            </select>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setApplyBp(null)}
                className="px-4 py-2 border border-slate-300 dark:border-white/10 rounded-xl text-sm"
              >
                Cancel
              </button>
              <button
                onClick={executeApply}
                className="px-5 py-2 bg-[#b08d57] dark:bg-gold dark:text-[#102841] text-white font-bold rounded-xl text-sm hover:opacity-90"
              >
                Apply Manifest
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Custom Blueprint Modal */}
      {showCreate && (
        <div className="modal">
          <form
            onSubmit={handleCreateBlueprintSubmit}
            className="modal-card w-full max-w-md rounded-xl border border-leather/20 dark:border-white/10 bg-[#fffdf8] dark:bg-[#132238] p-7 shadow-passport text-[#1e3a5f] dark:text-[#eee6d7]"
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-serif text-2xl text-left">Create Blueprint</h3>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4 text-left">
              <label className="block text-sm font-semibold text-leather dark:text-[#eee6d7]/85">
                Blueprint Name
                <input
                  type="text"
                  required
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Europe Backpacking"
                  className="mt-1 input rounded-xl border border-leather/20 dark:border-white/15 bg-parchment dark:bg-[#101c2e]"
                />
              </label>

              <label className="block text-sm font-semibold text-leather dark:text-[#eee6d7]/85">
                Blueprint Type
                <select
                  value={createType}
                  onChange={(e) => setCreateType(e.target.value)}
                  className="mt-1 input rounded-xl border border-leather/20 dark:border-white/15 bg-parchment dark:bg-[#101c2e]"
                >
                  {journeyTypes.map((type) => (
                    <option key={type} value={type}>
                      {pretty(type)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 border border-slate-300 dark:border-white/10 rounded-xl text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#b08d57] dark:bg-gold dark:text-[#102841] text-[#16345a] font-bold rounded-xl text-sm hover:opacity-90"
              >
                Create Template
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
function Passport({ traveler, journeys, imageUrls }: { traveler: Traveler; journeys: Journey[]; imageUrls: Record<string, string> }) { return <main className="mx-auto max-w-[1100px] px-5 py-14"><p className="font-mono text-xs tracking-[.2em] text-[#a47e40]">TRAVEL DOCUMENT · {traveler.name.toUpperCase()}</p><h1 className="mt-2 font-serif text-4xl">My Passport</h1><p className="mt-2 text-[#6f4e37]">A collection of every cleared journey.</p><div className="passport-page mt-8 grid gap-8 p-8 sm:grid-cols-2">{journeys.map((journey) => <article className="passport-stamp-card" key={journey.id}><img src={imageUrls[journey.destination] || imageFor(journey.destination)} alt="" /><div className="passport-stamp-shade" /><div className="relative z-10 text-center text-white"><span className="text-5xl">{flagFor(journey.destination)}</span><p className="mt-4 font-mono text-[10px] font-bold tracking-[.24em]">ENTRY STAMP · CLEARED</p><h2 className="mt-2 font-serif text-4xl">{journey.destination}</h2></div></article>)}{!journeys.length && <p className="col-span-full py-12 text-center text-slate-500">Clear a full manifest to earn your first passport stamp.</p>}</div></main>; }
function NewJourney({
  onClose,
  onCreate,
  blueprints,
  auth,
  onResolveImage,
}: {
  onClose: () => void;
  onCreate: (values: {
    title: string;
    destination: string;
    origin?: string | null;
    type: string;
    departureAt: string;
    returnAt?: string | null;
    blueprintId?: string;
  }) => Promise<void>;
  blueprints: Blueprint[];
  auth: Record<string, string>;
  onResolveImage: (destination: string, origin?: string | null) => void;
}) {
  const [step, setStep] = useState(1);
  const [city, setCity] = useState("");
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const shouldSuggestRef = useRef(true);

  const [originCity, setOriginCity] = useState("");
  const [originSuggestions, setOriginSuggestions] = useState<string[]>([]);
  const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);
  const shouldSuggestOriginRef = useRef(true);

  useEffect(() => {
    if (!shouldSuggestRef.current) {
      shouldSuggestRef.current = true;
      return;
    }
    const timer = setTimeout(() => {
      if (city && city.trim().length >= 2) {
        const fetchSuggestions = async () => {
          try {
            setIsSearchingCity(true);
            const res = await request<{ locations: Array<{ label: string }> }>(`/locations?query=${encodeURIComponent(city)}`, { headers: auth });
            setCitySuggestions(res.locations.map((loc) => loc.label));
          } catch {
            setCitySuggestions([]);
          } finally {
            setIsSearchingCity(false);
          }
        };
        void fetchSuggestions();
      } else {
        setCitySuggestions([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [city, auth]);

  const handleSelectSuggestion = (label: string) => {
    const parts = label.split(",");
    const selectedCity = parts[0]?.trim() || "";
    const selectedCountry = parts[parts.length - 1]?.trim() || "";
    
    shouldSuggestRef.current = false;
    setCity(selectedCity);
    setCountry(selectedCountry);
    setCitySuggestions([]);
    setTitle(`Trip to ${selectedCity}`);
    onResolveImage(label, originCity.trim() ? `${originCity.trim()}, ${originCountry.trim()}` : null);
  };

  useEffect(() => {
    if (!shouldSuggestOriginRef.current) {
      shouldSuggestOriginRef.current = true;
      return;
    }
    const timer = setTimeout(() => {
      if (originCity && originCity.trim().length >= 2) {
        const fetchSuggestions = async () => {
          try {
            setIsSearchingOrigin(true);
            const res = await request<{ locations: Array<{ label: string }> }>(`/locations?query=${encodeURIComponent(originCity)}`, { headers: auth });
            setOriginSuggestions(res.locations.map((loc) => loc.label));
          } catch {
            setOriginSuggestions([]);
          } finally {
            setIsSearchingOrigin(false);
          }
        };
        void fetchSuggestions();
      } else {
        setOriginSuggestions([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [originCity, auth]);

  const handleSelectOriginSuggestion = (label: string) => {
    const parts = label.split(",");
    const selectedCity = parts[0]?.trim() || "";
    const selectedCountry = parts[parts.length - 1]?.trim() || "";
    
    shouldSuggestOriginRef.current = false;
    setOriginCity(selectedCity);
    setOriginCountry(selectedCountry);
    setOriginSuggestions([]);
    if (city.trim()) {
      onResolveImage(`${city.trim()}, ${country.trim()}`, label);
    }
  };

  const [country, setCountry] = useState("");
  const [originCountry, setOriginCountry] = useState("");
  const [departureAt, setDepartureAt] = useState("");
  const [returnAt, setReturnAt] = useState("");

  const [title, setTitle] = useState("");
  const [type, setType] = useState("CUSTOM");
  const [blueprintId, setBlueprintId] = useState("");

  const quickDestinations = [
    { city: "Kyoto", country: "Japan", flag: "🇯🇵", icon: "⛩️", type: "CITY_BREAK" },
    { city: "Lisbon", country: "Portugal", flag: "🇵🇹", icon: "🐚", type: "BEACH_ESCAPE" },
    { city: "Marrakech", country: "Morocco", flag: "🇲🇦", icon: "🕌", type: "CITY_BREAK" },
    { city: "Cape Town", country: "South Africa", flag: "🇿🇦", icon: "🦁", type: "ADVENTURE" },
    { city: "Reykjavik", country: "Iceland", flag: "🇮🇸", icon: "🌋", type: "ADVENTURE" },
    { city: "Havana", country: "Cuba", flag: "🇨🇺", icon: "🎺", type: "CITY_BREAK" },
  ];

  const handleQuickSelect = (q: typeof quickDestinations[number]) => {
    setCity(q.city);
    setCountry(q.country);
    setType(q.type);
    setTitle(`Trip to ${q.city}`);
    onResolveImage(`${q.city}, ${q.country}`, originCity.trim() ? `${originCity.trim()}, ${originCountry.trim()}` : null);
  };

  const handleContinue = () => {
    if (!city.trim() || !country.trim() || !originCity.trim() || !originCountry.trim() || !departureAt) {
      alert("Please fill in origin city, origin country, destination city, destination country, and departure date.");
      return;
    }
    const depDate = new Date(departureAt);
    if (depDate < new Date()) {
      alert("The departure date must be in the future.");
      return;
    }
    if (returnAt) {
      const retDate = new Date(returnAt);
      if (retDate <= depDate) {
        alert("The return date must be after the departure date.");
        return;
      }
    }
    if (!title) {
      setTitle(`Trip to ${city}`);
    }
    onResolveImage(`${city.trim()}, ${country.trim()}`, `${originCity.trim()}, ${originCountry.trim()}`);
    setStep(2);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const depDate = new Date(departureAt);
    if (depDate < new Date()) {
      alert("The departure date must be in the future.");
      return;
    }
    if (returnAt) {
      const retDate = new Date(returnAt);
      if (retDate <= depDate) {
        alert("The return date must be after the departure date.");
        return;
      }
    }
    const destinationStr = `${city.trim()}, ${country.trim()}`;
    const originStr = `${originCity.trim()}, ${originCountry.trim()}`;
    await onCreate({
      title: title.trim(),
      destination: destinationStr,
      origin: originStr,
      type,
      departureAt: depDate.toISOString(),
      returnAt: returnAt ? new Date(returnAt).toISOString() : null,
      blueprintId: blueprintId || undefined,
    });
  };

  // Combine default and custom blueprints for selection dropdown
  const allBlueprints = useMemo(() => {
    const list = [
      ...PRE_MADE_BLUEPRINTS.map((bp) => ({ id: bp.id, name: bp.name, preset: true })),
      ...blueprints.map((bp) => ({ id: bp.id, name: bp.name, preset: false })),
    ];
    
    const seen = new Set<string>();
    const unique: { id: string; name: string }[] = [];
    
    list.forEach((bp) => {
      const cleanName = bp.name.toLowerCase().trim();
      if (!seen.has(cleanName)) {
        seen.add(cleanName);
        unique.push({ id: bp.id, name: `${bp.name} (${bp.preset ? "Preset" : "Custom"})` });
      }
    });
    return unique;
  }, [blueprints]);

  return (
    <div className="modal">
      <div className="modal-card w-full max-w-xl rounded-xl border border-leather/20 dark:border-white/10 bg-[#fffdf8] dark:bg-[#132238] p-7 shadow-passport text-[#1e3a5f] dark:text-[#eee6d7]">
        <button
          type="button"
          onClick={onClose}
          className="float-right text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <p className="text-xs font-bold uppercase tracking-[.2em] text-passport dark:text-gold">
          {step === 1 ? "STEP 1 OF 2 · ITINERARY DETAILS" : "STEP 2 OF 2 · SELECT BLUEPRINT & DETAILS"}
        </p>
        <h2 className="mt-2 font-serif text-3xl text-leather dark:text-[#eee6d7]">Plan a Journey</h2>

        <hr className="my-5 border-slate-200 dark:border-white/10" />

        {step === 1 ? (
          <div>
            {/* Quick Destinations */}
            <p className="text-xs font-bold uppercase tracking-[.15em] text-[#b18c6f] mb-3">Quick Destinations</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {quickDestinations.map((q) => (
                <button
                  key={q.city}
                  type="button"
                  onClick={() => handleQuickSelect(q)}
                  className={`p-3 rounded-lg border text-center transition flex flex-col items-center justify-center gap-1 bg-white dark:bg-[#101c2e] hover:border-passport dark:hover:border-gold ${
                    city === q.city
                      ? "border-passport dark:border-gold ring-1 ring-passport dark:ring-gold"
                      : "border-slate-200 dark:border-white/10"
                  }`}
                >
                  <span className="text-2xl" role="img" aria-label={q.city}>
                    {q.icon}
                  </span>
                  <span className="font-bold text-sm block">{q.city}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block">{q.country}</span>
                </button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-leather dark:text-[#eee6d7]/85 relative">
                Origin City
                <input
                  value={originCity}
                  onChange={(e) => {
                    shouldSuggestOriginRef.current = true;
                    setOriginCity(e.target.value);
                  }}
                  onBlur={() => setTimeout(() => setOriginSuggestions([]), 200)}
                  required
                  placeholder="e.g. New York"
                  className="mt-1 input rounded-xl border border-leather/20 dark:border-white/15 bg-parchment dark:bg-[#101c2e] w-full"
                />
                {originSuggestions.length > 0 && (
                  <ul className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#132238] shadow-lg z-50 text-left">
                    {originSuggestions.map((label) => (
                      <li key={label}>
                        <button
                          type="button"
                          onClick={() => handleSelectOriginSuggestion(label)}
                          className="w-full text-left px-4 py-2 text-xs hover:bg-[#f5f1e8] dark:hover:bg-[#101c2e] text-slate-700 dark:text-[#eee6d7]/90 transition-colors"
                        >
                          📍 {label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </label>
              <label className="block text-sm font-semibold text-leather dark:text-[#eee6d7]/85">
                Origin Country
                <input
                  value={originCountry}
                  onChange={(e) => setOriginCountry(e.target.value)}
                  required
                  placeholder="e.g. United States"
                  className="mt-1 input rounded-xl border border-leather/20 dark:border-white/15 bg-parchment dark:bg-[#101c2e]"
                />
              </label>
              <label className="block text-sm font-semibold text-leather dark:text-[#eee6d7]/85 relative">
                Destination City
                <input
                  value={city}
                  onChange={(e) => {
                    shouldSuggestRef.current = true;
                    setCity(e.target.value);
                    setTitle(`Trip to ${e.target.value}`);
                  }}
                  onBlur={() => setTimeout(() => setCitySuggestions([]), 200)}
                  required
                  placeholder="e.g. Istanbul"
                  className="mt-1 input rounded-xl border border-leather/20 dark:border-white/15 bg-parchment dark:bg-[#101c2e] w-full"
                />
                {citySuggestions.length > 0 && (
                  <ul className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#132238] shadow-lg z-50 text-left">
                    {citySuggestions.map((label) => (
                      <li key={label}>
                        <button
                          type="button"
                          onClick={() => handleSelectSuggestion(label)}
                          className="w-full text-left px-4 py-2 text-xs hover:bg-[#f5f1e8] dark:hover:bg-[#101c2e] text-slate-700 dark:text-[#eee6d7]/90 transition-colors"
                        >
                          📍 {label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </label>
              <label className="block text-sm font-semibold text-leather dark:text-[#eee6d7]/85">
                Country
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                  placeholder="e.g. Turkey"
                  className="mt-1 input rounded-xl border border-leather/20 dark:border-white/15 bg-parchment dark:bg-[#101c2e]"
                />
              </label>
              <label className="block text-sm font-semibold text-leather dark:text-[#eee6d7]/85">
                Departure Date
                <input
                  type="datetime-local"
                  value={departureAt}
                  onChange={(e) => setDepartureAt(e.target.value)}
                  required
                  min={new Date().toISOString().slice(0, 16)}
                  className="mt-1 input rounded-xl border border-leather/20 dark:border-white/15 bg-parchment dark:bg-[#101c2e]"
                />
              </label>
              <label className="block text-sm font-semibold text-leather dark:text-[#eee6d7]/85">
                Return Date (Optional)
                <input
                  type="datetime-local"
                  value={returnAt}
                  onChange={(e) => setReturnAt(e.target.value)}
                  min={departureAt || new Date().toISOString().slice(0, 16)}
                  className="mt-1 input rounded-xl border border-leather/20 dark:border-white/15 bg-parchment dark:bg-[#101c2e]"
                />
              </label>
            </div>

            {/* Action buttons */}
            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 font-semibold hover:bg-slate-50 dark:hover:bg-white/5 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleContinue}
                className="px-6 py-2.5 rounded-xl bg-passport dark:bg-gold dark:text-[#102841] text-white font-semibold text-sm hover:opacity-90"
              >
                Continue →
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-leather dark:text-[#eee6d7]/85">
                Journey Title
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Kyoto Adventure"
                  className="mt-1 input rounded-xl border border-leather/20 dark:border-white/15 bg-parchment dark:bg-[#101c2e]"
                />
              </label>

              <label className="block text-sm font-semibold text-leather dark:text-[#eee6d7]/85">
                Journey Type
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="mt-1 input rounded-xl border border-leather/20 dark:border-white/15 bg-parchment dark:bg-[#101c2e]"
                >
                  {journeyTypes.map((type) => (
                    <option key={type} value={type}>
                      {pretty(type)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-semibold text-leather dark:text-[#eee6d7]/85">
                Select Packing Blueprint
                <select
                  value={blueprintId}
                  onChange={(e) => setBlueprintId(e.target.value)}
                  className="mt-1 input rounded-xl border border-leather/20 dark:border-white/15 bg-parchment dark:bg-[#101c2e]"
                >
                  <option value="">No blueprint — start blank</option>
                  {allBlueprints.map((blueprint) => (
                    <option key={blueprint.id} value={blueprint.id}>
                      {blueprint.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Action buttons */}
            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 font-semibold hover:bg-slate-50 dark:hover:bg-white/5 text-sm"
              >
                ← Back
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#b08d57] dark:bg-gold dark:text-[#102841] text-white font-semibold text-sm hover:opacity-90"
              >
                Issue Journey Passport
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
function JourneyDetail({ journey, onClose, onAddItem, onQuickAdd, onToggle, onRemoveItem, onRemoveJourney, onSaveBlueprint, blueprints, onApplyBlueprint, auth, imageUrl, insightsData }: { journey: Journey; onClose: () => void; onAddItem: (event: FormEvent<HTMLFormElement>) => void; onQuickAdd: (name: string) => void; onToggle: (item: Item) => void; onRemoveItem: (item: Item) => void; onRemoveJourney: () => void; onSaveBlueprint: (journeyId: string) => void; blueprints: Blueprint[]; onApplyBlueprint: (blueprintId: string, journeyId: string) => void; auth: Record<string, string>; imageUrl: string; insightsData: any }) {
  const [tab, setTab] = useState<"manifest" | "info" | "advisories">("manifest");
  const [weather, setWeather] = useState<Weather | null>(null);
  const [weatherError, setWeatherError] = useState("");
  const status = clearance(journey);
  const groups = journey.items.reduce<Record<string, Item[]>>((all, item) => { const key = pretty(item.category ?? "OTHER"); (all[key] ??= []).push(item); return all; }, {});

  const parts = journey.destination.split(",");
  const cityPart = parts[0]?.trim() || journey.destination;
  const countryPart = parts[1]?.trim() || "";
  const daysToDeparture = Math.max(0, Math.ceil((new Date(journey.departureAt).getTime() - Date.now()) / 86400000));

  useEffect(() => {
    let cancelled = false;
    setWeather(null);
    setWeatherError("");

    request<Weather>(`/weather?destination=${encodeURIComponent(journey.destination)}&date=${journey.departureAt.slice(0, 10)}`, { headers: auth })
      .then((result) => {
        if (cancelled) return;
        setWeather(result);
      })
      .catch((error) => {
        if (cancelled) return;
        setWeatherError(error instanceof Error ? error.message : "Unable to retrieve weather clearance.");
      });

    return () => {
      cancelled = true;
    };
  }, [journey.destination, journey.departureAt, auth]);

  return <div className="journey-detail-modal fixed inset-0 z-40 overflow-auto bg-[#f5f1e8]"><section className="detail-hero"><img src={imageUrl} alt="" /><div className="detail-shade" /><button onClick={onClose} className="absolute left-7 top-7 font-mono text-sm tracking-wider text-white">← DEPARTURE LOUNGE</button><div className="absolute right-7 top-7 grid h-20 w-20 place-items-center rounded-full border-4 bg-[#16345a]/60 font-mono text-lg" style={{ borderColor: getProgressBarColor(status.state), color: getProgressBarColor(status.state) }}>{status.percent}%<small className="block text-[9px] text-[#eee6d7]">CLEARED</small></div><div className="absolute bottom-8 left-7 text-white"><p className="font-mono text-xs tracking-[.16em] text-[#d6aa62]">✈ PW {journey.id.slice(-3).toUpperCase()} · GATE {airportCode(journey.destination)}2 · TERMINAL T2F</p><h1 className="mt-3 font-serif text-5xl font-bold">{cityPart}</h1><p className="mt-2 font-mono text-xs tracking-wider text-white/90">{flagFor(journey.destination)} {countryPart ? `${countryPart} · ` : ""}{new Date(journey.departureAt).toLocaleDateString(undefined, { day: "2-digit", month: "long", year: "numeric" })}{daysToDeparture > 0 ? ` · T-${daysToDeparture} days` : " · DEPARTED"}</p></div></section><nav className="border-b border-[#d9cfbd] bg-[#f8f6f0]"><div className="mx-auto flex max-w-[1440px] gap-3 px-4 sm:gap-8 sm:px-7">{(["manifest", "info", "advisories"] as const).map((key) => <button key={key} onClick={() => setTab(key)} className={`detail-tab ${tab === key ? "active" : ""}`}>{key === "manifest" ? "▧ MANIFEST" : key === "info" ? "⌖ JOURNEY INFO" : "☁ ADVISORIES"}</button>)}</div></nav><main className="mx-auto max-w-[1450px] px-4 py-10 sm:px-7"><AnimatePresence mode="wait"><motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .2 }}>{tab === "manifest" ? <Manifest journey={journey} groups={groups} onAddItem={onAddItem} onToggle={onToggle} onRemoveItem={onRemoveItem} onRemoveJourney={onRemoveJourney} onSaveBlueprint={() => onSaveBlueprint(journey.id)} blueprints={blueprints} onApplyBlueprint={(blueprintId) => onApplyBlueprint(blueprintId, journey.id)} /> : tab === "info" ? <JourneyInfo journey={journey} insightsData={insightsData} /> : <WeatherDashboard weather={weather} error={weatherError} onAdd={onQuickAdd} />}</motion.div></AnimatePresence></main></div>;
}
function Manifest({ journey, groups, onAddItem, onToggle, onRemoveItem, onRemoveJourney, onSaveBlueprint, blueprints, onApplyBlueprint }: { journey: Journey; groups: Record<string, Item[]>; onAddItem: (event: FormEvent<HTMLFormElement>) => void; onToggle: (item: Item) => void; onRemoveItem: (item: Item) => void; onRemoveJourney: () => void; onSaveBlueprint: () => void; blueprints: Blueprint[]; onApplyBlueprint: (blueprintId: string) => void }) {
  const done = journey.items.filter((item) => item.isStamped).length;
  const [applyId, setApplyId] = useState("");
  return <>
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="w-full md:w-auto flex-grow max-w-lg">
        <h2 className="font-serif text-3xl text-left">Packing Manifest</h2>
        <p className="mt-2 font-mono text-sm tracking-wider text-[#b18c6f] text-left">
          {done} OF {journey.items.length} ITEMS STAMPED · {journey.items.length - done} ITEMS REMAINING
        </p>
        <div className="w-full bg-[#f0ece1] dark:bg-slate-800/50 h-1 rounded-full overflow-hidden mt-3">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${journey.items.length ? Math.round((done / journey.items.length) * 100) : 0}%`,
              backgroundColor: getProgressBarColor(clearance(journey).state)
            }}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {blueprints.length > 0 && <>
          <select className="input" value={applyId} onChange={(event) => setApplyId(event.target.value)}>
            <option value="">Apply a blueprint…</option>
            {blueprints.map((blueprint) => <option key={blueprint.id} value={blueprint.id}>{blueprint.name}</option>)}
          </select>
          <button
            disabled={!applyId}
            onClick={() => { if (!applyId) return; onApplyBlueprint(applyId); setApplyId(""); }}
            className="border border-[#16345a] px-4 py-3 text-xs font-bold tracking-wider text-[#16345a] disabled:cursor-not-allowed disabled:opacity-40"
          >
            APPLY
          </button>
        </>}
        <button onClick={onSaveBlueprint} className="border border-[#b08d57] px-4 py-3 text-xs font-bold tracking-wider text-[#16345a]">SAVE AS BLUEPRINT</button>
        <button onClick={() => window.print()} className="border border-gold px-4 py-3 text-xs font-bold tracking-wider text-[#16345a] dark:text-gold">PRINT MANIFEST</button>
        <button onClick={onRemoveJourney} className="border border-[#8b1e3f]/40 px-4 py-3 text-xs font-bold tracking-wider text-[#8b1e3f]">REMOVE JOURNEY</button>
      </div>
    </div>
    <form onSubmit={onAddItem} className="manifest-add-row mt-6"><input className="input manifest-add-input" name="name" placeholder="Type your travel item here…" required /><select className="input manifest-category" name="category">{categories.map((category) => <option key={category} value={category}>{pretty(category)}</option>)}</select><button className="bg-[#16345a] px-5 text-3xl text-white" aria-label="Add item"><Plus /></button></form>
    <div className="mt-7 space-y-5">{Object.entries(groups).map(([category, items]) => <section key={category} className="border border-[#d9cfbd] bg-[#fbfaf6]"><header className="flex items-center justify-between bg-[#f0eee8] px-6 py-4"><h3 className="font-mono text-sm font-bold tracking-[.16em] text-[#16345a]">▣ {category.toUpperCase()} <span className="ml-2 text-[#b18c6f]">{items.filter((item) => item.isStamped).length}/{items.length}</span></h3></header>{items.map((item) => <div key={item.id} className={`flex items-center gap-4 border-t border-[#e6e0d4] px-6 py-4 ${item.isStamped ? "bg-emerald-50/70" : ""}`}><button onClick={() => void onToggle(item)} className={`grid h-7 w-7 place-items-center rounded-sm border ${item.isStamped ? "border-emerald-500 bg-emerald-500 text-white" : "border-[#cfc5b5]"}`}>{item.isStamped && <Check className="h-4 w-4" />}</button><span className={`font-serif text-xl ${item.isStamped ? "text-[#8e8b82] line-through" : "text-[#16345a]"}`}>{item.name}</span>{!item.isStamped && <span className="border border-red-300 px-2 py-1 text-[10px] font-bold tracking-wider text-red-500">ESSENTIAL</span>}<button onClick={() => void onRemoveItem(item)} className="ml-auto text-slate-400 hover:text-[#8b1e3f]" aria-label={`Remove ${item.name}`}><Trash2 className="h-4 w-4" /></button></div>)}</section>)}{!journey.items.length && <div className="border border-dashed border-[#b08d57] py-12 text-center text-slate-500">Your manifest is ready to be filled.</div>}</div>
  </>;
}
const getDynamicQuote = (dest: string) => {
  const lower = dest.toLowerCase();
  if (lower.includes("paris")) return "“Marais apartment booked. Musée d'Orsay tickets pre-purchased.”";
  if (lower.includes("tokyo")) return "“Shibuya hotel reserved. Ghibli Museum tickets confirmed.”";
  if (lower.includes("lisbon")) return "“Alfama apartment booked. Sintra day-trip planned.”";
  if (lower.includes("marrakech")) return "“Riad in Medina booked. Desert tour scheduled.”";
  if (lower.includes("cape town")) return "“Waterfront hotel booked. Table Mountain cableway tickets purchased.”";
  if (lower.includes("reykjavik")) return "“Guesthouse booked. Northern Lights tour registered.”";
  if (lower.includes("havana")) return "“Casa Particular booked. Walking tour arranged.”";
  return "“Itinerary saved. Travel essentials prepared.”";
};

const getCurrencyCode = (dest: string) => {
  const lower = dest.toLowerCase();
  if (lower.includes("japan") || lower.includes("tokyo")) return "JPY";
  if (lower.includes("france") || lower.includes("paris") || lower.includes("portugal") || lower.includes("lisbon")) return "EUR";
  if (lower.includes("london") || lower.includes("uk") || lower.includes("england")) return "GBP";
  if (lower.includes("usa") || lower.includes("america") || lower.includes("new york")) return "USD";
  if (lower.includes("south africa") || lower.includes("cape town")) return "ZAR";
  if (lower.includes("morocco") || lower.includes("marrakech")) return "MAD";
  if (lower.includes("cuba") || lower.includes("havana")) return "CUP";
  if (lower.includes("india") || lower.includes("goa")) return "INR";
  return "EUR";
};

const destAirportCode = (dest: string) => {
  const lower = dest.toLowerCase();
  if (lower.includes("paris")) return "CDG";
  if (lower.includes("tokyo")) return "HND";
  if (lower.includes("lisbon")) return "LIS";
  if (lower.includes("london")) return "LHR";
  if (lower.includes("new york")) return "JFK";
  if (lower.includes("cape town")) return "CPT";
  if (lower.includes("reykjavik")) return "KEF";
  if (lower.includes("havana")) return "HAV";
  return airportCode(dest);
};

function JourneyInfo({ journey, insightsData }: { journey: Journey; insightsData: any }) {
  const departure = new Date(journey.departureAt);
  const returnDt = journey.returnAt ? new Date(journey.returnAt) : null;
  const diffTime = returnDt ? Math.max(0, returnDt.getTime() - departure.getTime()) : 0;
  const nights = returnDt ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;

  const currencyCode = insightsData?.currencyCode || getCurrencyCode(journey.destination);
  const quote = insightsData?.notes || getDynamicQuote(journey.destination);
  const destCode = destAirportCode(journey.destination);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Boarding Pass */}
        <div className="relative overflow-hidden rounded-2xl bg-[#102841] text-white p-6 shadow-md border border-white/5 text-left">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, white 2px, transparent 2px)", backgroundSize: "16px 16px" }} />
          
          <div className="flex justify-between items-center mb-6">
            <span className="text-[10px] font-bold tracking-[0.25em] text-[#d6aa62] uppercase">BOARDING PASS</span>
            <span className="text-[10px] font-mono text-white/55">PW TICKET SYSTEM</span>
          </div>

          <div className="flex justify-between items-center mb-6 text-left">
            <div>
              <p className="text-[10px] text-white/45 uppercase tracking-wider">FROM</p>
              <h3 className="text-3xl font-serif font-bold tracking-tight">{insightsData?.originCode || "HOM"}</h3>
              <p className="text-[10px] text-white/60">{journey.origin ? journey.origin.split(",")[0] : "Home Airport"}</p>
            </div>
            <div className="flex-1 border-t border-dashed border-white/20 mx-4 relative">
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs">✈</span>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/45 uppercase tracking-wider">TO</p>
              <h3 className="text-3xl font-serif font-bold tracking-tight">{insightsData?.destinationCode || destCode}</h3>
              <p className="text-[10px] text-white/60">{journey.destination.split(",")[0]}</p>
            </div>
          </div>

          <div className="border-t border-dashed border-white/20 my-5" />

          <div className="grid grid-cols-4 gap-4 text-left">
            <div>
              <p className="text-[9px] text-white/45 uppercase tracking-wider">FLIGHT</p>
              <p className="text-xs font-mono font-bold text-[#d6aa62]">PW {journey.id.slice(-3).toUpperCase()}</p>
            </div>
            <div>
              <p className="text-[9px] text-white/45 uppercase tracking-wider">GATE</p>
              <p className="text-xs font-mono font-bold">{airportCode(journey.destination)}2</p>
            </div>
            <div>
              <p className="text-[9px] text-white/45 uppercase tracking-wider">TERMINAL</p>
              <p className="text-xs font-mono font-bold">T2F</p>
            </div>
            <div>
              <p className="text-[9px] text-white/45 uppercase tracking-wider">DEPARTS</p>
              <p className="text-xs font-mono font-bold">
                {departure.toLocaleDateString(undefined, { day: "2-digit", month: "short" })}
              </p>
            </div>
          </div>

          <div className="border-t border-dashed border-white/10 my-4" />

          <div className="grid grid-cols-2 gap-4 text-left text-[10px] font-mono">
            <div>
              <p className="text-[8px] text-white/45 uppercase tracking-wider">ORIGIN TIMEZONE</p>
              <p className="text-white/80">{insightsData?.originTimezone || "America/New_York"} ({insightsData?.originTimezoneOffset || "GMT-5"})</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] text-white/45 uppercase tracking-wider">DESTINATION TIMEZONE</p>
              <p className="text-[#d6aa62]">{insightsData?.destinationTimezone || "Europe/Stockholm"} ({insightsData?.destinationTimezoneOffset || "GMT+1"})</p>
            </div>
          </div>
        </div>

        {/* Journey Notes */}
        <div className="border border-[#d9cfbd] bg-[#fffdf8] dark:bg-[#132238] dark:border-white/10 p-6 rounded-2xl flex flex-col justify-between shadow-sm text-left">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#a47e40] uppercase mb-4">JOURNEY NOTES</p>
            <p className="font-serif italic text-lg text-[#16345a] dark:text-[#eee6d7] leading-relaxed my-4">
              {quote}
            </p>
          </div>
          
          <div className="mt-6 border-t border-slate-100 dark:border-white/5 pt-4 space-y-2 text-sm text-left">
            <div className="flex justify-between">
              <span className="text-slate-400 dark:text-white/45 uppercase tracking-wider text-[10px] font-bold">PURPOSE</span>
              <span className="font-semibold text-[#16345a] dark:text-[#eee6d7]">{pretty(journey.type)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 dark:text-white/45 uppercase tracking-wider text-[10px] font-bold">DURATION</span>
              <span className="font-semibold text-[#16345a] dark:text-[#eee6d7]">{nights ? `${nights} nights` : "1 day"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 dark:text-white/45 uppercase tracking-wider text-[10px] font-bold">RETURN</span>
              <span className="font-semibold text-[#16345a] dark:text-[#eee6d7]">
                {returnDt ? returnDt.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }) : "One-way Journey"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Advisories Panel */}
      <div className="border border-[#d9cfbd] bg-[#fbfaf7] dark:bg-[#132238]/50 dark:border-white/10 p-6 rounded-2xl shadow-sm text-left">
        <p className="text-[10px] font-bold tracking-[0.2em] text-[#a47e40] uppercase mb-5">
          DESTINATION ADVISORIES · {journey.destination.toUpperCase()}
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-[#f5f1e8] dark:bg-[#101c2e] p-5 rounded-xl flex items-start gap-4 border border-slate-100 dark:border-white/5 text-left">
            <span className="text-2xl text-[#b08d57]"><FileText className="h-6 w-6" /></span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">ENTRY CLEARANCE</p>
              <p className="text-sm text-[#16345a] dark:text-[#eee6d7]/90 leading-relaxed">
                {insightsData?.entryClearance || "Arrival card required at immigration. Complete in-flight."}
              </p>
            </div>
          </div>
          
          <div className="bg-[#f5f1e8] dark:bg-[#101c2e] p-5 rounded-xl flex items-start gap-4 border border-slate-100 dark:border-white/5 text-left">
            <span className="text-2xl text-[#b08d57]"><Banknote className="h-6 w-6" /></span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">CURRENCY RULES</p>
              <p className="text-sm text-[#16345a] dark:text-[#eee6d7]/90 leading-relaxed">
                {insightsData?.currencyName 
                  ? `Local currency (${currencyCode} - ${insightsData.currencyName}) widely preferred. ATMs available at airport.`
                  : `Local currency (${currencyCode}) widely preferred. ATMs available at airport.`}
              </p>
            </div>
          </div>

          <div className="bg-[#f5f1e8] dark:bg-[#101c2e] p-5 rounded-xl flex items-start gap-4 border border-slate-100 dark:border-white/5 text-left">
            <span className="text-2xl text-[#b08d57]"><Smartphone className="h-6 w-6" /></span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">CONNECTIVITY</p>
              <p className="text-sm text-[#16345a] dark:text-[#eee6d7]/90 leading-relaxed">
                {insightsData?.connectivity || "SIM card or international roaming — confirm before departure."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}