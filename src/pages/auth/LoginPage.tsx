import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { AppLogo } from "@/components/common/AppLogo";
import { FlowerBackground } from "@/components/common/FlowerBackground";
import { ArrowRight, ArrowLeft, Cpu, BookOpen, Sparkles } from "lucide-react";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/*  Motivational quotes — VLSI / GATE / Engineering study themed       */
/* ------------------------------------------------------------------ */
const QUOTES = [
  { text: "Every flip-flop you understand brings you one clock cycle closer to your dream chip.", author: "— DuoMate" },
  { text: "GATE rank is not destiny. It is design.", author: "— DuoMate" },
  { text: "Debug your fears. Synthesize your dreams.", author: "— DuoMate" },
  { text: "The expert in VLSI was once confused by a D flip-flop.", author: "— DuoMate" },
  { text: "RTL to GDSII — one block at a time. Keep building.", author: "— DuoMate" },
  { text: "Two minds studying together are worth more than ten studying alone.", author: "— DuoMate" },
  { text: "Your Verilog testbench today is your silicon success tomorrow.", author: "— DuoMate" },
  { text: "Consistency over intensity. Show up every day, even for 30 minutes.", author: "— DuoMate" },
  { text: "The difference between a dream and a plan is a deadline. Set yours.", author: "— DuoMate" },
  { text: "Great engineers are not born. They are compiled, synthesized, and placed & routed.", author: "— DuoMate" },
  { text: "One GATE question at a time. One concept at a time. Trust the process.", author: "— DuoMate" },
  { text: "Signals and Systems made you sweat. CMOS logic will make you proud.", author: "— DuoMate" },
];

type Person = "aadhavan" | "narmatha";

const PROFILES = {
  aadhavan: {
    label: "Aadhavan",
    initial: "A",
    tagline: "VLSI Architecture & AI Accelerators",
    gradient: "from-indigo-500 to-blue-600",
    arrowBg: "bg-indigo-500/15 group-hover:bg-indigo-500 text-indigo-400 group-hover:text-white",
    avatarBg: "bg-gradient-to-br from-indigo-500 to-blue-600",
    hoverBorder: "hover:border-indigo-500/60",
    hoverBg: "hover:bg-indigo-500/10",
    btnShadow: "shadow-indigo-500/30",
  },
  narmatha: {
    label: "Narmatha",
    initial: "N",
    tagline: "Digital Electronics & Semiconductor Systems",
    gradient: "from-purple-500 to-pink-600",
    arrowBg: "bg-purple-500/15 group-hover:bg-purple-500 text-purple-400 group-hover:text-white",
    avatarBg: "bg-gradient-to-br from-purple-500 to-pink-600",
    hoverBorder: "hover:border-purple-500/60",
    hoverBg: "hover:bg-purple-500/10",
    btnShadow: "shadow-purple-500/30",
  },
};

export function LoginPage() {
  const { loginAsDemo } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [selected, setSelected] = useState<Person | null>(null);
  const [quote, setQuote] = useState(QUOTES[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);

  const handleSelectPerson = (person: Person) => {
    setSelected(person);
    setStep(2);
  };

  const handleEnter = () => {
    if (!selected) return;
    setLoading(true);
    setTimeout(() => {
      loginAsDemo(selected);
      toast.success(`Welcome back, ${PROFILES[selected].label}! 🚀 Let's achieve our goals.`);
      navigate("/");
    }, 500);
  };

  const profile = selected ? PROFILES[selected] : null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Animated Flower Background */}
      <FlowerBackground />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm space-y-4 relative z-10"
      >
        {/* ── Brand Header with Official DuoMate App Icon ── */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center relative group">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-indigo-500 to-pink-500 blur-lg opacity-60 group-hover:opacity-90 transition-opacity" />
            <AppLogo size="xl" className="relative shadow-2xl border border-white/20" />
          </div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-transparent">
            DuoMate
          </h1>
          <p className="text-xs text-white/70 font-medium flex items-center justify-center gap-1.5">
            <Sparkles className="h-3 w-3 text-pink-400" />
            <span>Two Friends. One Goal. Better Every Day.</span>
            <Sparkles className="h-3 w-3 text-indigo-400" />
          </p>
        </div>

        {/* ── Motivational Quote ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-black/50 backdrop-blur-xl border border-white/15 rounded-xl p-4 text-center space-y-1.5 shadow-xl"
        >
          <BookOpen className="h-4 w-4 text-pink-400 mx-auto mb-1 opacity-90" />
          <p className="text-xs text-white/90 font-medium leading-relaxed italic">
            "{quote.text}"
          </p>
          <p className="text-[10px] text-pink-300/80 font-semibold">{quote.author}</p>
        </motion.div>

        {/* ── Step Container ── */}
        <div className="bg-black/60 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden">
          <AnimatePresence mode="wait">

            {/* STEP 1 — Choose your profile */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
                className="p-5 space-y-4"
              >
                <div className="text-center space-y-0.5">
                  <h2 className="text-sm font-bold text-white">Who is studying today?</h2>
                  <p className="text-[11px] text-white/60">
                    Select your profile to enter your shared workspace
                  </p>
                </div>

                <div className="space-y-2.5">
                  {(["aadhavan", "narmatha"] as Person[]).map((p) => {
                    const pr = PROFILES[p];
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handleSelectPerson(p)}
                        className={`group w-full p-3.5 rounded-xl border border-white/10 ${pr.hoverBorder} ${pr.hoverBg} bg-white/5 transition-all flex items-center justify-between text-left`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl ${pr.avatarBg} flex items-center justify-center shadow-lg font-black text-white text-sm ring-1 ring-white/30`}>
                            {pr.initial}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white group-hover:text-pink-200 transition-colors">
                              {pr.label}
                            </p>
                            <p className="text-[10px] text-white/60 leading-tight mt-0.5">
                              {pr.tagline}
                            </p>
                          </div>
                        </div>
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${pr.arrowBg}`}>
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 2 — Enter Workspace */}
            {step === 2 && profile && selected && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="p-5 space-y-5"
              >
                {/* Back + Profile header */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setSelected(null); }}
                    className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white/70 hover:text-white"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl ${profile.avatarBg} flex items-center justify-center shadow-md font-bold text-white text-sm ring-1 ring-white/30`}>
                      {profile.initial}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{profile.label}</p>
                      <p className="text-[10px] text-white/60">{profile.tagline}</p>
                    </div>
                  </div>
                </div>

                {/* Study domains summary */}
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${profile.gradient} flex items-center justify-center shadow-md ${profile.btnShadow}`}>
                    <Cpu className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Private Career Portal</p>
                    <p className="text-[10px] text-white/50">GATE ECE · VLSI · AI Hardware</p>
                  </div>
                </div>

                {/* Primary Enter Action */}
                <button
                  type="button"
                  onClick={handleEnter}
                  disabled={loading}
                  className={`w-full h-11 rounded-xl bg-gradient-to-r ${profile.gradient} text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl ${profile.btnShadow} hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {loading ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Entering workspace…
                    </>
                  ) : (
                    <>
                      Enter Workspace
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center text-white/40">
                  Shared exclusively for Aadhavan &amp; Narmatha
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer info pills */}
        <div className="flex items-center justify-center gap-3 text-[10px] text-white/40">
          <span>🌸 VLSI Design</span>
          <span>•</span>
          <span>GATE ECE</span>
          <span>•</span>
          <span>AI Semiconductors 🌺</span>
        </div>
      </motion.div>
    </div>
  );
}
