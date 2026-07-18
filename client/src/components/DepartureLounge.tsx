import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Check, Compass, Moon, Plus, Trash2, X } from "lucide-react";
import { request, type Traveler } from "../lib/api";
import DepartureStamp from "./DepartureStamp";
import WeatherDashboard, { type Weather } from "./WeatherDashboard";

type Item = { id: string; name: string; isStamped: boolean; category?: string };
type Journey = { id: string; title: string; destination: string; type: string; departureAt: string; returnAt?: string | null; items: Item[] };
type Blueprint = { id: string; name: string; type: string; items: Item[] };
type Location = { label: string };
const types = ["CITY_BREAK", "BEACH_ESCAPE", "BUSINESS", "ADVENTURE", "INTERNATIONAL", "FAMILY", "CUSTOM"];
const label = (value: string) => value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (x: string) => x.toUpperCase());
const code = (destination: string) => destination.replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase().padEnd(3, "TRP");
const flagFor = (destination: string) => { const name = destination.toLowerCase(); if (name.includes("paris") || name.includes("france")) return "🇫🇷"; if (name.includes("tokyo") || name.includes("japan")) return "🇯🇵"; if (name.includes("london") || name.includes("england") || name.includes("uk")) return "🇬🇧"; if (name.includes("new york") || name.includes("usa") || name.includes("america")) return "🇺🇸"; if (name.includes("buenos") || name.includes("argentina")) return "🇦🇷"; if (name.includes("goa") || name.includes("india")) return "🇮🇳"; return "🌍"; };
const imageFor = (destination: string) => { const city = destination.toLowerCase(); if (city.includes("tokyo")) return "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=85"; if (city.includes("paris")) return "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=85"; if (city.includes("london")) return "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=85"; if (city.includes("new york")) return "https://images.unsplash.com/photo-1522083165195-3424ed129620?auto=format&fit=crop&w=1200&q=85"; if (city.includes("beach") || city.includes("goa")) return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85"; return "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=85"; };

const journeyTypes = ["CITY_BREAK", "BEACH_ESCAPE", "BUSINESS", "ADVENTURE", "INTERNATIONAL", "FAMILY", "CUSTOM"];
const categories = ["OTHER", "DOCUMENTS", "CLOTHING", "ELECTRONICS", "TOILETRIES", "MEDICINE", "ACCESSORIES"];
const pretty = (value: string) => value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter: string) => letter.toUpperCase());
const airportCode = (destination: string) => destination.replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase().padEnd(3, "TRP");

function clearance(journey: Journey) {
  const percent = journey.items.length ? Math.round((journey.items.filter((item) => item.isStamped).length / journey.items.length) * 100) : 0;
  return { percent, state: percent === 100 ? "CLEARED" : percent ? "ON TRACK" : "PENDING", colour: percent === 100 ? "green" : percent ? "gold" : "muted" };
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

export default function DepartureLounge({ traveler, onSignOut }: { traveler: Traveler; onSignOut: () => void }) {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [selected, setSelected] = useState<Journey | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [page, setPage] = useState<"lounge" | "blueprints" | "passport">("lounge");
  const [notice, setNotice] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [stamp, setStamp] = useState<Journey | null>(null);
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

  const active = useMemo(() => journeys.filter((journey) => new Date(journey.departureAt) >= new Date()).sort((a, b) => +new Date(a.departureAt) - +new Date(b.departureAt)), [journeys]);
  const completed = journeys.filter((journey) => journey.items.length > 0 && journey.items.every((item) => item.isStamped));
  const totalItems = journeys.reduce((total, journey) => total + journey.items.length, 0);
  const packed = journeys.reduce((total, journey) => total + journey.items.filter((item) => item.isStamped).length, 0);
  const days = active[0] ? Math.max(0, Math.ceil((+new Date(active[0].departureAt) - Date.now()) / 86400000)) : 0;

  const createJourney = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const blueprintId = String(form.get("blueprintId") || "");
    try {
      await request("/journeys", { method: "POST", headers: auth, body: JSON.stringify({ title: form.get("title"), destination: form.get("destination"), type: form.get("type"), departureAt: new Date(String(form.get("departureAt"))).toISOString(), returnAt: form.get("returnAt") ? new Date(String(form.get("returnAt"))).toISOString() : null, blueprintId: blueprintId || undefined }) });
      setShowNew(false); setNotice("Journey added to the departure board."); await refresh();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to create journey."); }
  };
  const searchLocations = async (query: string) => {
    if (query.trim().length < 2) return setLocations([]);
    try { setLocations((await request<{ locations: Location[] }>(`/locations?query=${encodeURIComponent(query)}`, { headers: auth })).locations); } catch { setLocations([]); }
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
    await request(`/journeys/${selected.id}`, { method: "DELETE", headers: auth }); setSelected(null); await refresh();
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

  return <div className="min-h-screen bg-[#f5f1e8] text-[#16345a]">
    <Header page={page} setPage={setPage} onNew={() => setShowNew(true)} onSignOut={onSignOut} />
    {notice && <button onClick={() => setNotice("")} className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#16345a] px-5 py-3 text-sm text-white shadow-xl">{notice}</button>}
    {page === "lounge" && <>
      <section className="board-shell"><div className="mx-auto max-w-[1560px] px-5 py-9"><div className="flex items-center justify-between"><div><h1 className="font-serif text-4xl text-white">Departure Lounge</h1><p className="mt-1 font-mono text-xs tracking-[.2em] text-[#c19c5b]">GATE STATUS · ALL TERMINALS</p></div><span className="font-mono text-xs tracking-[.2em] text-[#19dca4]">● LIVE</span></div><div className="mt-9 overflow-auto"><div className="min-w-[760px]"><div className="board-row board-label"><span>DESTINATION</span><span>TIME</span><span>STATUS</span><span>FLIGHT</span><span>GATE</span></div>{active.slice(0, 5).map((journey) => { const status = clearance(journey); return <button onClick={() => setSelected(journey)} key={journey.id} className="board-row board-flight"><b>{journey.destination.toUpperCase()}</b><FlipTime date={journey.departureAt} /><span className={status.colour}>{status.state}</span><span>PW {journey.id.slice(-3).toUpperCase()}</span><span>{airportCode(journey.destination)}2</span></button>; })}{!active.length && <p className="py-10 text-center font-mono text-sm text-white/55">NO JOURNEYS ON THE BOARD — CREATE YOUR FIRST DEPARTURE</p>}</div></div></div></section>
      <section className="border-b border-[#d9cfbd] bg-[#f7f4ec]"><div className="mx-auto grid max-w-[1100px] grid-cols-2 gap-8 px-5 py-7 text-center sm:grid-cols-4"><Stat value={String(active.length)} label="ACTIVE JOURNEYS" /><Stat value={`${days} days`} label="DAYS TO DEPARTURE" /><Stat value={`${packed} / ${totalItems}`} label="ITEMS STAMPED" /><Stat value={`${totalItems ? Math.round((packed / totalItems) * 100) : 0}%`} label="OVERALL CLEARANCE" /></div></section>
      <main className="mx-auto max-w-[1500px] px-5 py-14"><div className="flex items-end justify-between"><div><h2 className="font-serif text-3xl">Your Journeys</h2><p className="mt-2 font-mono text-xs tracking-[.15em] text-[#b18c6f]">{active.length} UPCOMING · SORTED BY DEPARTURE</p></div></div>{active.length ? <div className="mt-10 grid gap-7 md:grid-cols-2 xl:grid-cols-3">{active.map((journey) => <JourneyCard journey={journey} key={journey.id} onOpen={() => setSelected(journey)} />)}</div> : <EmptyState onNew={() => setShowNew(true)} />}</main>
    </>}
    {page === "blueprints" && <Blueprints blueprints={blueprints} onRename={renameBlueprint} onDelete={deleteBlueprint} />}
    {page === "passport" && <Passport traveler={traveler} journeys={completed} />}
    {showNew && <NewJourney locations={locations} blueprints={blueprints} onClose={() => setShowNew(false)} onSubmit={createJourney} search={searchLocations} />}
    {selected && <JourneyDetail journey={journeys.find((journey) => journey.id === selected.id) ?? selected} onClose={() => setSelected(null)} onAddItem={addItem} onQuickAdd={quickAddItem} onToggle={toggleItem} onRemoveItem={removeItem} onRemoveJourney={removeJourney} onSaveBlueprint={saveBlueprint} blueprints={blueprints} onApplyBlueprint={applyBlueprint} auth={auth} />}
    {stamp && <DepartureStamp destination={stamp.destination} onClose={() => { setStamp(null); setSelected(null); setPage("passport"); }} />}
  </div>;
}

function Header({ page, setPage, onNew, onSignOut }: { page: "lounge" | "blueprints" | "passport"; setPage: (page: "lounge" | "blueprints" | "passport") => void; onNew: () => void; onSignOut: () => void }) {
  return <><header className="border-y-4 border-[#8b1e3f] bg-[#24466d] text-white"><div className="mx-auto flex h-[84px] max-w-[1560px] items-center justify-between px-5"><button onClick={() => setPage("lounge")} className="flex items-center gap-4"><span className="grid h-11 w-11 place-items-center rounded-sm bg-[#b08d57] text-xl">◉</span><span className="text-left"><b className="font-serif text-xl tracking-[.16em]">PACKWISE</b><small className="block text-[10px] tracking-[.28em] text-[#d6aa62]">READY FOR DEPARTURE</small></span></button><nav className="hidden gap-3 md:flex">{(["lounge", "blueprints", "passport"] as const).map((key) => <button key={key} onClick={() => setPage(key)} className={`nav-tab ${page === key ? "active" : ""}`}>{key === "lounge" ? "▱ DEPARTURE LOUNGE" : key === "blueprints" ? "▰ TRAVEL BLUEPRINTS" : "◌ MY PASSPORT"}</button>)}</nav><div className="flex items-center gap-4"><button onClick={onNew} className="hidden bg-[#b08d57] px-5 py-3 text-xs font-bold tracking-[.16em] text-[#102841] sm:block">＋ NEW JOURNEY</button><Moon className="h-5 w-5 text-white/60" /><button onClick={onSignOut} className="text-xs text-white/70">SIGN OUT</button></div></div></header><nav className="grid grid-cols-3 border-b border-[#d9cfbd] bg-[#f8f6f0] md:hidden">{(["lounge", "blueprints", "passport"] as const).map((key) => <button key={key} onClick={() => setPage(key)} className={`mobile-nav ${page === key ? "active" : ""}`}>{key.toUpperCase()}</button>)}</nav></>;
}
function Stat({ value, label }: { value: string; label: string }) { return <div><b className="font-serif text-4xl text-[#b08d57]">{value}</b><p className="mt-2 font-mono text-[10px] tracking-[.18em] text-[#b18c6f]">{label}</p></div>; }
function EmptyState({ onNew }: { onNew: () => void }) { return <div className="mt-10 grid place-items-center border border-dashed border-[#b08d57] p-16 text-center"><Compass className="h-9 w-9 text-[#b08d57]" /><h3 className="mt-4 font-serif text-2xl">Your passport is waiting for its first stamp.</h3><button onClick={onNew} className="mt-5 bg-[#b08d57] px-5 py-3 text-xs font-bold tracking-wider">PLAN A JOURNEY</button></div>; }
function JourneyCard({ journey, onOpen }: { journey: Journey; onOpen: () => void }) { const status = clearance(journey); return <motion.button whileHover={{ y: -5 }} onClick={onOpen} className="journey-photo-card text-left"><img src={imageFor(journey.destination)} alt={journey.destination} /><div className="photo-overlay" /><span className="flight-tag">✈ PW {journey.id.slice(-3).toUpperCase()}</span><span className={`status-tag ${status.colour}`}>{status.state}</span><div className="absolute bottom-24 left-6 text-white"><h3 className="font-serif text-4xl">{journey.title}</h3><p className="mt-1 font-mono text-sm">{flagFor(journey.destination)} {journey.destination} · {pretty(journey.type)}</p></div><div className="card-footer"><span><small>◷ DEPARTURE</small><b>{new Date(journey.departureAt).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}</b></span><span className="text-right"><b className="font-serif text-3xl text-[#b08d57]">{status.percent}%</b><small>CLEARANCE</small></span></div></motion.button>; }
function Blueprints({ blueprints, onRename, onDelete }: { blueprints: Blueprint[]; onRename: (blueprint: Blueprint) => void; onDelete: (blueprint: Blueprint) => void }) {
  return <main className="mx-auto max-w-[1500px] px-5 py-14">
    <h1 className="font-serif text-4xl">Travel Blueprints</h1>
    <p className="mt-2 text-[#6f4e37]">Save a manifest once and take it with you everywhere.</p>
    <div className="mt-9 grid gap-5 md:grid-cols-3">
      {blueprints.map((blueprint) => <article className="border border-[#d9cfbd] bg-white p-6" key={blueprint.id}>
        <BookOpen className="text-[#b08d57]" />
        <p className="mt-6 text-xs tracking-wider text-[#8b1e3f]">{pretty(blueprint.type)}</p>
        <h2 className="mt-2 font-serif text-2xl">{blueprint.name}</h2>
        <p className="mt-3 text-sm text-slate-500">{blueprint.items.length} travel items</p>
        <div className="mt-5 flex gap-4">
          <button onClick={() => onRename(blueprint)} className="text-xs font-bold tracking-wider text-[#16345a]">RENAME</button>
          <button onClick={() => onDelete(blueprint)} className="text-xs font-bold tracking-wider text-[#8b1e3f]">DELETE</button>
        </div>
      </article>)}
      {!blueprints.length && <p className="col-span-full py-12 text-center text-slate-500">No blueprints yet — save a manifest to create your first one.</p>}
    </div>
  </main>;
}
function Passport({ traveler, journeys }: { traveler: Traveler; journeys: Journey[] }) { return <main className="mx-auto max-w-[1100px] px-5 py-14"><p className="font-mono text-xs tracking-[.2em] text-[#a47e40]">TRAVEL DOCUMENT · {traveler.name.toUpperCase()}</p><h1 className="mt-2 font-serif text-4xl">My Passport</h1><p className="mt-2 text-[#6f4e37]">A collection of every cleared journey.</p><div className="passport-page mt-8 grid gap-8 p-8 sm:grid-cols-2">{journeys.map((journey) => <article className="passport-stamp-card" key={journey.id}><img src={imageFor(journey.destination)} alt="" /><div className="passport-stamp-shade" /><div className="relative z-10 text-center text-white"><span className="text-5xl">{flagFor(journey.destination)}</span><p className="mt-4 font-mono text-[10px] font-bold tracking-[.24em]">ENTRY STAMP · CLEARED</p><h2 className="mt-2 font-serif text-4xl">{journey.destination}</h2></div></article>)}{!journeys.length && <p className="col-span-full py-12 text-center text-slate-500">Clear a full manifest to earn your first passport stamp.</p>}</div></main>; }
function NewJourney({ onClose, onSubmit, locations, blueprints, search }: { onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; locations: Location[]; blueprints: Blueprint[]; search: (query: string) => void }) {
  return <div className="modal"><form onSubmit={onSubmit} className="modal-card">
    <button type="button" onClick={onClose} className="float-right" aria-label="Close"><X /></button>
    <p className="text-xs tracking-[.2em] text-[#8b1e3f]">NEW ITINERARY</p>
    <h2 className="mt-2 font-serif text-3xl">Plan a Journey</h2>
    <div className="mt-7 grid gap-4 sm:grid-cols-2">
      <input className="input sm:col-span-2" name="title" required placeholder="Journey title" />
      <input className="input sm:col-span-2" name="destination" list="locations" required placeholder="Type a city or destination" onChange={(event) => void search(event.target.value)} />
      <datalist id="locations">{locations.map((location) => <option key={location.label} value={location.label} />)}</datalist>
      <select name="type" className="input">{journeyTypes.map((type) => <option key={type}>{type}</option>)}</select>
      <select name="blueprintId" className="input"><option value="">No blueprint — start blank</option>{blueprints.map((blueprint) => <option key={blueprint.id} value={blueprint.id}>{blueprint.name}</option>)}</select>
      <input className="input" type="datetime-local" name="departureAt" required />
      <input className="input sm:col-span-2" type="datetime-local" name="returnAt" />
      <button className="mt-2 bg-[#b08d57] py-3 text-xs font-bold tracking-wider text-[#102841] sm:col-span-2">ISSUE JOURNEY PASSPORT</button>
    </div>
  </form></div>;
}
function JourneyDetail({ journey, onClose, onAddItem, onQuickAdd, onToggle, onRemoveItem, onRemoveJourney, onSaveBlueprint, blueprints, onApplyBlueprint, auth }: { journey: Journey; onClose: () => void; onAddItem: (event: FormEvent<HTMLFormElement>) => void; onQuickAdd: (name: string) => void; onToggle: (item: Item) => void; onRemoveItem: (item: Item) => void; onRemoveJourney: () => void; onSaveBlueprint: (journeyId: string) => void; blueprints: Blueprint[]; onApplyBlueprint: (blueprintId: string, journeyId: string) => void; auth: Record<string, string> }) {
  const [tab, setTab] = useState<"manifest" | "info" | "advisories">("manifest");
  const [weather, setWeather] = useState<Weather | null>(null);
  const [weatherError, setWeatherError] = useState("");
  const status = clearance(journey);
  const groups = journey.items.reduce<Record<string, Item[]>>((all, item) => { const key = pretty(item.category ?? "OTHER"); (all[key] ??= []).push(item); return all; }, {});

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

  return <div className="fixed inset-0 z-40 overflow-auto bg-[#f5f1e8]"><section className="detail-hero"><img src={imageFor(journey.destination)} alt="" /><div className="detail-shade" /><button onClick={onClose} className="absolute left-7 top-7 font-mono text-sm tracking-wider text-white">← DEPARTURE LOUNGE</button><div className="absolute right-7 top-7 grid h-20 w-20 place-items-center rounded-full border-4 border-[#b08d57] bg-[#16345a]/60 font-mono text-lg text-[#d6aa62]">{status.percent}%<small className="block text-[9px]">CLEARED</small></div><div className="absolute bottom-8 left-7 text-white"><p className="font-mono text-sm tracking-[.16em] text-[#d6aa62]">✈ PW {journey.id.slice(-3).toUpperCase()} · GATE {airportCode(journey.destination)}2 · TERMINAL T2F</p><h1 className="mt-3 font-serif text-5xl">{journey.title}</h1><p className="mt-2 font-mono text-sm">{flagFor(journey.destination)} {journey.destination} · ◷ {new Date(journey.departureAt).toLocaleDateString(undefined, { day: "2-digit", month: "long", year: "numeric" })}</p></div></section><nav className="border-b border-[#d9cfbd] bg-[#f8f6f0]"><div className="mx-auto flex max-w-[1440px] gap-3 px-4 sm:gap-8 sm:px-7">{(["manifest", "info", "advisories"] as const).map((key) => <button key={key} onClick={() => setTab(key)} className={`detail-tab ${tab === key ? "active" : ""}`}>{key === "manifest" ? "▧ MANIFEST" : key === "info" ? "⌖ JOURNEY INFO" : "☁ ADVISORIES"}</button>)}</div></nav><main className="mx-auto max-w-[1450px] px-4 py-10 sm:px-7"><AnimatePresence mode="wait"><motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .2 }}>{tab === "manifest" ? <Manifest journey={journey} groups={groups} onAddItem={onAddItem} onToggle={onToggle} onRemoveItem={onRemoveItem} onRemoveJourney={onRemoveJourney} onSaveBlueprint={() => onSaveBlueprint(journey.id)} blueprints={blueprints} onApplyBlueprint={(blueprintId) => onApplyBlueprint(blueprintId, journey.id)} /> : tab === "info" ? <JourneyInfo journey={journey} progress={status.percent} /> : <WeatherDashboard weather={weather} error={weatherError} onAdd={onQuickAdd} />}</motion.div></AnimatePresence></main></div>;
}
function Manifest({ journey, groups, onAddItem, onToggle, onRemoveItem, onRemoveJourney, onSaveBlueprint, blueprints, onApplyBlueprint }: { journey: Journey; groups: Record<string, Item[]>; onAddItem: (event: FormEvent<HTMLFormElement>) => void; onToggle: (item: Item) => void; onRemoveItem: (item: Item) => void; onRemoveJourney: () => void; onSaveBlueprint: () => void; blueprints: Blueprint[]; onApplyBlueprint: (blueprintId: string) => void }) {
  const done = journey.items.filter((item) => item.isStamped).length;
  const [applyId, setApplyId] = useState("");
  return <>
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><h2 className="font-serif text-3xl">Packing Manifest</h2><p className="mt-2 font-mono text-sm tracking-wider text-[#b18c6f]">{done} OF {journey.items.length} ITEMS STAMPED · {journey.items.length - done} ITEMS REMAINING</p></div>
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
        <button onClick={onRemoveJourney} className="border border-[#8b1e3f]/40 px-4 py-3 text-xs font-bold tracking-wider text-[#8b1e3f]">REMOVE JOURNEY</button>
      </div>
    </div>
    <form onSubmit={onAddItem} className="manifest-add-row mt-6"><input className="input manifest-add-input" name="name" placeholder="Type your travel item here…" required /><select className="input manifest-category" name="category">{categories.map((category) => <option key={category} value={category}>{pretty(category)}</option>)}</select><button className="bg-[#16345a] px-5 text-3xl text-white" aria-label="Add item"><Plus /></button></form>
    <div className="mt-7 space-y-5">{Object.entries(groups).map(([category, items]) => <section key={category} className="border border-[#d9cfbd] bg-[#fbfaf6]"><header className="flex items-center justify-between bg-[#f0eee8] px-6 py-4"><h3 className="font-mono text-sm font-bold tracking-[.16em] text-[#16345a]">▣ {category.toUpperCase()} <span className="ml-2 text-[#b18c6f]">{items.filter((item) => item.isStamped).length}/{items.length}</span></h3></header>{items.map((item) => <div key={item.id} className={`flex items-center gap-4 border-t border-[#e6e0d4] px-6 py-4 ${item.isStamped ? "bg-emerald-50/70" : ""}`}><button onClick={() => void onToggle(item)} className={`grid h-7 w-7 place-items-center rounded-sm border ${item.isStamped ? "border-emerald-500 bg-emerald-500 text-white" : "border-[#cfc5b5]"}`}>{item.isStamped && <Check className="h-4 w-4" />}</button><span className={`font-serif text-xl ${item.isStamped ? "text-[#8e8b82] line-through" : "text-[#16345a]"}`}>{item.name}</span>{!item.isStamped && <span className="border border-red-300 px-2 py-1 text-[10px] font-bold tracking-wider text-red-500">ESSENTIAL</span>}<button onClick={() => void onRemoveItem(item)} className="ml-auto text-slate-400 hover:text-[#8b1e3f]" aria-label={`Remove ${item.name}`}><Trash2 className="h-4 w-4" /></button></div>)}</section>)}{!journey.items.length && <div className="border border-dashed border-[#b08d57] py-12 text-center text-slate-500">Your manifest is ready to be filled.</div>}</div>
  </>;
}
function JourneyInfo({ journey, progress }: { journey: Journey; progress: number }) { return <section className="detail-grid"><article><small>DESTINATION</small><h2>{flagFor(journey.destination)} {journey.destination}</h2><p>Your selected {pretty(journey.type).toLowerCase()} journey.</p></article><article><small>DEPARTURE</small><h2>{new Date(journey.departureAt).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</h2><p>Boarding gate {airportCode(journey.destination)}2 · Terminal T2F</p></article><article><small>MANIFEST STATUS</small><h2>{progress}% cleared</h2><p>{journey.items.filter((item) => !item.isStamped).length} travel items remain.</p></article></section>; }