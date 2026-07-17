import { motion } from "framer-motion";

export default function SplitFlap({ value, label }: { value: string; label: string }) {
  return <div className="min-w-[72px] text-center"><div className="split-flap rounded-md px-2 py-2 font-mono text-2xl font-bold tracking-[.14em] text-[#f7f0dd] sm:text-3xl"><motion.span key={value} initial={{ rotateX: -85, opacity: 0 }} animate={{ rotateX: 0, opacity: 1 }} transition={{ duration: .35 }}>{value}</motion.span></div><p className="mt-2 text-[9px] font-bold uppercase tracking-[.2em] text-white/45">{label}</p></div>;
}
