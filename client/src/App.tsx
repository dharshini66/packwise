import { useState, useEffect, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LockKeyhole, Mail, Plane, Stamp, UserRound, Sun, Moon } from "lucide-react";
import { request, type Traveler } from "./lib/api";
import DepartureLounge from "./components/DepartureLounge";

type Mode = "login" | "register";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 95, damping: 15 },
  },
};

const flightPathVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 0.12,
    transition: { duration: 2.8, ease: "easeInOut" as const },
  },
};

function AuthCard({ onAuthenticated }: { onAuthenticated: (traveler: Traveler) => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const values = new FormData(event.currentTarget);
    try {
      const payload = await request<{ user: Traveler; token: string }>(
        `/auth/${mode === "login" ? "login" : "register"}`,
        {
          method: "POST",
          body: JSON.stringify({
            name: values.get("name"),
            email: values.get("email"),
            password: values.get("password"),
          }),
        }
      );
      localStorage.setItem("packwise_token", payload.token);
      onAuthenticated(payload.user);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to proceed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring" as const, stiffness: 85, damping: 14 }}
      className="w-full max-w-md rounded-[1.8rem] border border-leather/20 dark:border-white/10 bg-[#fffdf8] dark:bg-[#132238] p-7 shadow-passport sm:p-9 text-[#1e3a5f] dark:text-[#eee6d7]"
    >
      <div className="mb-7 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-passport dark:text-gold">
            Travel credentials
          </p>
          <h2 className="mt-1 font-serif text-3xl text-leather dark:text-[#eee6d7]">
            {mode === "login" ? "Welcome back" : "Begin your journey"}
          </h2>
        </div>
        <Stamp className="h-10 w-10 text-passport/75 dark:text-gold/75" />
      </div>
      <form className="space-y-4" onSubmit={submit}>
        {mode === "register" && (
          <label className="block text-sm font-semibold text-leather dark:text-[#eee6d7]/85">
            Full name
            <div className="relative mt-1">
              <UserRound className="absolute left-3 top-3 h-4 w-4 text-leather/55 dark:text-[#eee6d7]/50" />
              <input
                name="name"
                required
                minLength={2}
                placeholder="Ava Traveler"
                className="w-full rounded-xl border border-leather/20 dark:border-white/15 bg-parchment dark:bg-[#101c2e] px-10 py-2.5 outline-none focus:border-passport dark:focus:border-gold text-slate-800 dark:text-[#eee6d7]"
              />
            </div>
          </label>
        )}
        <label className="block text-sm font-semibold text-leather dark:text-[#eee6d7]/85">
          Email
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-leather/55 dark:text-[#eee6d7]/50" />
            <input
              name="email"
              required
              type="email"
              placeholder="you@example.com"
              className="w-full rounded-xl border border-leather/20 dark:border-white/15 bg-parchment dark:bg-[#101c2e] px-10 py-2.5 outline-none focus:border-passport dark:focus:border-gold text-slate-800 dark:text-[#eee6d7]"
            />
          </div>
        </label>
        <label className="block text-sm font-semibold text-leather dark:text-[#eee6d7]/85">
          Password
          <div className="relative mt-1">
            <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-leather/55 dark:text-[#eee6d7]/50" />
            <input
              name="password"
              required
              minLength={8}
              type="password"
              placeholder="At least 8 characters"
              className="w-full rounded-xl border border-leather/20 dark:border-white/15 bg-parchment dark:bg-[#101c2e] px-10 py-2.5 outline-none focus:border-passport dark:focus:border-gold text-slate-800 dark:text-[#eee6d7]"
            />
          </div>
        </label>
        {error && (
          <p className="rounded-lg bg-passport/10 dark:bg-red-500/10 px-3 py-2 text-sm text-passport dark:text-red-400">
            {error}
          </p>
        )}
        <button
          disabled={busy}
          className="w-full rounded-xl bg-passport dark:bg-gold dark:text-[#102841] px-4 py-3 font-semibold text-white transition hover:bg-[#701630] dark:hover:bg-[#a47e40] disabled:opacity-60"
        >
          {busy ? "Checking clearance…" : mode === "login" ? "Enter Departure Lounge" : "Create travel profile"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-leather/70 dark:text-[#eee6d7]/60">
        {mode === "login" ? "New to PackWise?" : "Already registered?"}{" "}
        <button
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
          }}
          className="font-bold text-passport dark:text-gold"
        >
          {mode === "login" ? "Create a profile" : "Sign in"}
        </button>
      </p>
    </motion.section>
  );
}

export default function App() {
  const [traveler, setTraveler] = useState<Traveler | null>(() => {
    const saved = localStorage.getItem("packwise_traveler");
    return saved ? (JSON.parse(saved) as Traveler) : null;
  });

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("packwise_theme");
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("packwise_theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  const signedIn = (user: Traveler) => {
    localStorage.setItem("packwise_traveler", JSON.stringify(user));
    setTraveler(user);
  };

  const signedOut = () => {
    localStorage.removeItem("packwise_token");
    localStorage.removeItem("packwise_traveler");
    setTraveler(null);
  };

  return (
    <AnimatePresence mode="wait">
      {traveler ? (
        <DepartureLounge
          key="lounge"
          traveler={traveler}
          onSignOut={signedOut}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      ) : (
        <main className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-5 py-10 lg:grid-cols-2 overflow-hidden dark:bg-[#0b132b] dark:text-[#eee6d7] transition-colors duration-300">
          <svg className="absolute inset-0 -z-10 h-full w-full stroke-leather/10 dark:stroke-gold/10" fill="none">
            <motion.path
              d="M-50,250 Q250,50 650,250 T1350,150"
              variants={flightPathVariants}
              initial="hidden"
              animate="visible"
              strokeDasharray="6,8"
              strokeWidth="2"
            />
            <motion.path
              d="M150,550 Q550,350 850,650 T1450,450"
              variants={flightPathVariants}
              initial="hidden"
              animate="visible"
              strokeDasharray="6,8"
              strokeWidth="2"
            />
          </svg>

          <div className="absolute right-5 top-5">
            <button
              onClick={toggleTheme}
              className="p-3 rounded-full bg-leather/10 dark:bg-white/10 text-leather dark:text-gold hover:opacity-80 transition"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>

          <motion.section
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col justify-center"
          >
            <motion.div variants={itemVariants} className="mb-8 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-passport text-white">
                <Plane className="h-5 w-5" />
              </span>
              <span className="font-serif text-2xl font-bold text-leather dark:text-gold">PackWise</span>
            </motion.div>

            <motion.p
              variants={itemVariants}
              className="text-xs font-bold uppercase tracking-[.25em] text-passport dark:text-gold"
            >
              Ready for Departure
            </motion.p>

            <motion.h1
              variants={itemVariants}
              className="mt-4 font-serif text-5xl leading-[1.04] text-terminal dark:text-[#eee6d7] sm:text-6xl"
            >
              Prepare beautifully.
              <br />
              <em className="text-leather dark:text-gold font-normal">Depart confidently.</em>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mt-6 max-w-lg text-lg leading-8 text-terminal/70 dark:text-[#eee6d7]/70"
            >
              A considered travel companion for journey planning, packing manifests, and every detail between here and
              elsewhere.
            </motion.p>
          </motion.section>

          <AuthCard onAuthenticated={signedIn} />
        </main>
      )}
    </AnimatePresence>
  );
}
