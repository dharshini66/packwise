import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LockKeyhole, Mail, Plane, Stamp, UserRound } from "lucide-react";
import { request, type Traveler } from "./lib/api";
import DepartureLounge from "./components/DepartureLounge";

type Mode = "login" | "register";

function AuthCard({ onAuthenticated }: { onAuthenticated: (traveler: Traveler) => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    const values = new FormData(event.currentTarget);
    try {
      const payload = await request<{ user: Traveler; token: string }>(`/auth/${mode === "login" ? "login" : "register"}`, {
        method: "POST", body: JSON.stringify({ name: values.get("name"), email: values.get("email"), password: values.get("password") }),
      });
      localStorage.setItem("packwise_token", payload.token); onAuthenticated(payload.user);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to proceed."); }
    finally { setBusy(false); }
  }

  return <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md rounded-[1.8rem] border border-leather/20 bg-[#fffdf8] p-7 shadow-passport sm:p-9">
    <div className="mb-7 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-passport">Travel credentials</p><h2 className="mt-1 font-serif text-3xl text-leather">{mode === "login" ? "Welcome back" : "Begin your journey"}</h2></div><Stamp className="h-10 w-10 text-passport/75" /></div>
    <form className="space-y-4" onSubmit={submit}>
      {mode === "register" && <label className="block text-sm font-semibold text-leather">Full name<div className="relative mt-1"><UserRound className="absolute left-3 top-3 h-4 w-4 text-leather/55" /><input name="name" required minLength={2} placeholder="Ava Traveler" className="w-full rounded-xl border border-leather/20 bg-parchment px-10 py-2.5 outline-none focus:border-passport" /></div></label>}
      <label className="block text-sm font-semibold text-leather">Email<div className="relative mt-1"><Mail className="absolute left-3 top-3 h-4 w-4 text-leather/55" /><input name="email" required type="email" placeholder="you@example.com" className="w-full rounded-xl border border-leather/20 bg-parchment px-10 py-2.5 outline-none focus:border-passport" /></div></label>
      <label className="block text-sm font-semibold text-leather">Password<div className="relative mt-1"><LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-leather/55" /><input name="password" required minLength={8} type="password" placeholder="At least 8 characters" className="w-full rounded-xl border border-leather/20 bg-parchment px-10 py-2.5 outline-none focus:border-passport" /></div></label>
      {error && <p className="rounded-lg bg-passport/10 px-3 py-2 text-sm text-passport">{error}</p>}
      <button disabled={busy} className="w-full rounded-xl bg-passport px-4 py-3 font-semibold text-white transition hover:bg-[#701630] disabled:opacity-60">{busy ? "Checking clearance…" : mode === "login" ? "Enter Departure Lounge" : "Create travel profile"}</button>
    </form>
    <p className="mt-6 text-center text-sm text-leather/70">{mode === "login" ? "New to PackWise?" : "Already registered?"} <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} className="font-bold text-passport">{mode === "login" ? "Create a profile" : "Sign in"}</button></p>
  </motion.section>;
}

export default function App() {
  const [traveler, setTraveler] = useState<Traveler | null>(() => { const saved = localStorage.getItem("packwise_traveler"); return saved ? JSON.parse(saved) as Traveler : null; });
  const signedIn = (user: Traveler) => { localStorage.setItem("packwise_traveler", JSON.stringify(user)); setTraveler(user); };
  const signedOut = () => { localStorage.removeItem("packwise_token"); localStorage.removeItem("packwise_traveler"); setTraveler(null); };
  return <AnimatePresence mode="wait">{traveler ? <DepartureLounge key="lounge" traveler={traveler} onSignOut={signedOut} /> : <main className="mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-5 py-10 lg:grid-cols-2"><section><div className="mb-8 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-passport text-white"><Plane /></span><span className="font-serif text-2xl font-bold text-leather">PackWise</span></div><p className="text-xs font-bold uppercase tracking-[.25em] text-passport">Ready for Departure</p><h1 className="mt-4 font-serif text-5xl leading-[1.04] text-terminal sm:text-6xl">Prepare beautifully.<br /><em className="text-leather">Depart confidently.</em></h1><p className="mt-6 max-w-lg text-lg leading-8 text-terminal/70">A considered travel companion for journey planning, packing manifests, and every detail between here and elsewhere.</p></section><AuthCard onAuthenticated={signedIn} /></main>}</AnimatePresence>;
}
