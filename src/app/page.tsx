"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { sounds } from "@/lib/sound";
import { Loader2 } from "lucide-react";

const DEMO_TOPICS = {
  Technology: [
    "AI will do more harm than good.",
    "Social media has destroyed genuine human connection.",
    "Smartphones are making us less intelligent."
  ],
  Business: [
    "Unpaid internships should be illegal.",
    "The 4-day workweek should be mandatory.",
    "Remote work is better than office work."
  ],
  Education: [
    "Standardized testing is an outdated metric.",
    "College degrees are no longer necessary for success.",
    "Financial literacy should be a mandatory subject."
  ],
  Culture: [
    "Cancel culture is toxic to society.",
    "Art should not be separated from the artist.",
    "Fast fashion should be heavily taxed."
  ],
  Sports: [
    "The designated hitter rule ruined baseball.",
    "College athletes should be paid salaries.",
    "Esports should be in the Olympic games."
  ],
  Philosophy: [
    "Free will is an illusion.",
    "History always repeats itself.",
    "Knowledge is not always a good thing."
  ],
  Politics: [
    "Voting should be legally mandatory.",
    "Term limits should apply to all politicians.",
    "The electoral college should be abolished."
  ],
  Health: [
    "Daily multivitamins do almost nothing for healthy adults.",
    "Sugar should be regulated like alcohol.",
    "Mental health days should be legally protected."
  ],
  Environment: [
    "Bottled water should be banned wherever tap water is safe.",
    "Nuclear energy is the only real solution.",
    "Electric cars are not actually green yet."
  ]
};

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [displayedTopics, setDisplayedTopics] = useState<string[]>([
    "The designated hitter rule ruined baseball.",
    "Daily multivitamins do almost nothing for healthy adults.",
    "Bottled water should be banned wherever tap water is safe."
  ]);

  const spinDemo = () => {
    setIsSpinning(true);
    setHasSpun(true);

    let pool: string[] = [];
    if (selectedCategory && DEMO_TOPICS[selectedCategory as keyof typeof DEMO_TOPICS]) {
      pool = DEMO_TOPICS[selectedCategory as keyof typeof DEMO_TOPICS];
    } else {
      pool = Object.values(DEMO_TOPICS).flat();
    }

    let spins = 0;
    const maxSpins = 18;
    let delay = 50;

    const run = () => {
      spins++;
      
      const prev = pool[Math.floor(Math.random() * pool.length)];
      const curr = pool[Math.floor(Math.random() * pool.length)];
      const next = pool[Math.floor(Math.random() * pool.length)];
      
      setDisplayedTopics([prev, curr, next]);
      sounds.playTick();

      if (spins >= maxSpins) {
        const finalCurr = pool[Math.floor(Math.random() * pool.length)];
        let finalPrev = pool[Math.floor(Math.random() * pool.length)];
        let finalNext = pool[Math.floor(Math.random() * pool.length)];
        
        while (finalPrev === finalCurr) {
          finalPrev = pool[Math.floor(Math.random() * pool.length)];
        }
        while (finalNext === finalCurr || finalNext === finalPrev) {
          finalNext = pool[Math.floor(Math.random() * pool.length)];
        }

        setDisplayedTopics([finalPrev, finalCurr, finalNext]);
        setIsSpinning(false);
        sounds.playReveal();
      } else {
        if (spins > 14) {
          delay += 75;
        } else if (spins > 8) {
          delay += 35;
        }
        setTimeout(run, delay);
      }
    };

    setTimeout(run, delay);
  };

  useEffect(() => {
    if (!loading && user) {
      getDoc(doc(db, "users", user.uid))
        .then(snap => {
          if (!snap.exists()) return;
          const data = snap.data();
          if (data?.onboardingComplete) {
            router.replace("/dashboard");
          } else {
            router.replace("/onboarding");
          }
        })
        .catch(err => {
          // Silently absorb permission errors during logout transitions
          console.log("Ignored background fetch error during signout:", err.message);
        });
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f11]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#c084fc]" />
      </div>
    );
  }


  return (
    <main className="bg-[#0f0f11] text-zinc-100 font-sans overflow-x-hidden">


      {/* ══ SECTION 1: HERO ══════════════════════════════════════ */}

      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-32 pb-24 overflow-hidden">

        {/* Background ambient glow */}
        <div className="absolute top-[-10%] left-[20%] w-[60%] h-[50%] rounded-full bg-[#7c3aed]/15 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] rounded-full bg-[#c084fc]/8 blur-[100px] pointer-events-none" />

        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-zinc-400 mb-8 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c084fc] animate-pulse" />
          Now accepting challengers
        </div>

        {/* Main headline */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-zinc-50 leading-tight tracking-tight max-w-4xl mx-auto">
          Become dangerously{" "}
          <span
            className="font-[family-name:var(--font-playfair)] italic"
            style={{ background: "linear-gradient(135deg, #c084fc, #a78bfa, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
          >
            articulate
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-xl mx-auto leading-relaxed">
          An impromptu speaking challenge that trains you to speak with confidence.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 bg-white text-zinc-950 font-bold rounded-full px-8 py-4 text-base shadow-[0_0_40px_rgba(255,255,255,0.18)] hover:shadow-[0_0_60px_rgba(255,255,255,0.28)] hover:scale-[1.03] transition-all"
          >
            Try Your First Speech →
          </Link>
          <Link href="/login" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            Already have an account? Sign in
          </Link>
        </div>

        {/* Progress preview cards */}
        <div className="mt-20 grid grid-cols-3 gap-4 w-full max-w-3xl mx-auto">
          {[
            { day: "Day 1", label: "Finding your voice", score: 42, color: "#ef4444" },
            { day: "Day 7", label: "Building rhythm", score: 68, color: "#f59e0b" },
            { day: "Day 14", label: "Sharp & confident", score: 91, color: "#c084fc" },
          ].map((item) => (
            <div
              key={item.day}
              className="relative bg-white/5 border border-white/8 rounded-2xl p-5 text-left backdrop-blur-sm hover:border-white/15 transition-all"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">{item.day}</p>
              <p className="text-sm text-zinc-400 mb-4">{item.label}</p>
              {/* Mini score bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${item.score}%`, backgroundColor: item.color }}
                  />
                </div>
                <span className="text-sm font-bold" style={{ color: item.color }}>{item.score}</span>
              </div>
              <p className="text-xs text-zinc-600 mt-2">Clarity score</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ SECTION 2: HOW IT WORKS ══════════════════════════════ */}
      <section className="relative px-6 py-32 overflow-hidden">

        {/* Subtle wavy background blob */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[80%] h-[60%] rounded-full bg-[#7c3aed]/6 blur-[140px]" />
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <h2 className="text-4xl sm:text-5xl font-bold text-zinc-50 text-center mb-16">
            How it{" "}
            <span className="font-[family-name:var(--font-playfair)] italic text-[#c084fc]">works</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Card 01 */}
            <div className="group relative bg-[#18181b] border border-zinc-800 rounded-2xl p-8 hover:border-[#c084fc]/30 hover:shadow-[0_0_40px_rgba(192,132,252,0.07)] transition-all duration-300">
              <div className="w-8 h-8 rounded-full border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-500 mb-6 group-hover:border-[#c084fc]/40 group-hover:text-[#c084fc] transition-all">
                01
              </div>
              {/* Mini recording visual */}
              <div className="w-full rounded-xl bg-[#0f0f11] border border-zinc-800 flex items-center justify-center py-5 mb-6 gap-1">
                <span className="w-1 h-3 bg-red-500 rounded-full animate-pulse" />
                {[2,4,3,5,3,4,2,3,5,4,2].map((h, i) => (
                  <span key={i} className="w-0.5 rounded-full bg-zinc-600" style={{ height: `${h * 4}px` }} />
                ))}
              </div>
              <h3 className="text-xl font-bold text-zinc-50 mb-3">Speak daily</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                60 seconds. One prompt. No script, no retakes. Just open the app, hit record, and riff.
              </p>
              <p className="mt-6 text-xs font-bold tracking-widest uppercase text-zinc-600">60 Seconds / Day</p>
            </div>

            {/* Card 02 — slightly elevated */}
            <div className="group relative bg-[#1c1c22] border border-zinc-700/60 rounded-2xl p-8 hover:border-[#c084fc]/40 hover:shadow-[0_0_60px_rgba(192,132,252,0.12)] transition-all duration-300 md:-translate-y-4">
              <div className="w-8 h-8 rounded-full border border-zinc-600 flex items-center justify-center text-xs font-bold text-zinc-400 mb-6 group-hover:border-[#c084fc]/60 group-hover:text-[#c084fc] transition-all">
                02
              </div>
              {/* Mini metrics visual */}
              <div className="w-full rounded-xl bg-[#0f0f11] border border-zinc-800 p-4 mb-6 flex flex-col gap-2">
                {[
                  { label: "Clarity", val: 82, color: "#c084fc" },
                  { label: "Confidence", val: 61, color: "#f97316" },
                  { label: "Filler", val: 45, color: "#facc15" },
                ].map((m) => (
                  <div key={m.label} className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500 w-16 shrink-0">{m.label}</span>
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${m.val}%`, backgroundColor: m.color }} />
                    </div>
                    <span className="text-xs font-bold text-zinc-400">{m.val}</span>
                  </div>
                ))}
              </div>
              <h3 className="text-xl font-bold text-zinc-50 mb-3">Get a detailed analysis</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Every recording gets broken down — filler words, pauses, WPM, clarity, confidence. Know exactly what to fix.
              </p>
              <p className="mt-6 text-xs font-bold tracking-widest uppercase text-zinc-600">Instant Feedback</p>
            </div>

            {/* Card 03 */}
            <div className="group relative bg-[#18181b] border border-zinc-800 rounded-2xl p-8 hover:border-[#c084fc]/30 hover:shadow-[0_0_40px_rgba(192,132,252,0.07)] transition-all duration-300">
              <div className="w-8 h-8 rounded-full border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-500 mb-6 group-hover:border-[#c084fc]/40 group-hover:text-[#c084fc] transition-all">
                03
              </div>
              {/* Coin visual */}
              <div className="w-full rounded-xl bg-[#0f0f11] border border-zinc-800 flex items-center justify-center py-5 mb-6 relative overflow-hidden">
                <div className="flex items-end gap-2">
                  {["$", "$", "", "$7", "", "$", "$"].map((t, i) => (
                    <span
                      key={i}
                      className={`flex items-center justify-center rounded-full font-bold ${
                        t === "$7"
                          ? "w-14 h-14 bg-[#c084fc] text-zinc-950 text-base shadow-[0_0_20px_rgba(192,132,252,0.5)]"
                          : "w-8 h-8 bg-yellow-500/80 text-zinc-950 text-xs"
                      }`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <h3 className="text-xl font-bold text-zinc-50 mb-3">Cash out</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Finish every day and $1/day comes back to you. 7 days → $7. 14 days → $14.
              </p>
              <p className="mt-6 text-xs font-bold tracking-widest uppercase text-zinc-600">End of Challenge</p>
            </div>

          </div>
        </div>
      </section>

      {/* ══ SECTION 2.5: INTERACTIVE DEMO SIMULATOR ══════════════ */}
      <section className="relative px-6 py-20 overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center">
          
          <div className="text-center space-y-4 mb-10">
            <h2 className="text-3xl md:text-5xl font-bold text-zinc-50 tracking-tight">
              Give it a <span className="font-[family-name:var(--font-playfair)] italic text-[#c084fc]">spin</span>
            </h2>
            <p className="text-sm md:text-base text-zinc-400 max-w-lg mx-auto">
              Select a category, hit Spin, and see what topic the mechanical generator lands on.
            </p>
          </div>

          {/* Category Select Pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-8 max-w-2xl">
            {Object.keys(DEMO_TOPICS).map((cat) => (
              <button
                key={cat}
                disabled={isSpinning}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold border transition-all ${
                  selectedCategory === cat
                    ? "bg-[#c084fc] text-zinc-950 border-[#c084fc]"
                    : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* The Slot Machine Card */}
          <div className="w-full max-w-2xl bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-10 md:p-14 flex flex-col items-center justify-center relative overflow-hidden shadow-[0_0_50px_rgba(192,132,252,0.03)] min-h-[350px]">
            
            {/* Soft decorative background curved shapes mimicking screenshot */}
            <div className="absolute inset-0 pointer-events-none opacity-5">
              <div className="absolute top-0 left-0 w-full h-full border-[30px] border-zinc-500 rounded-full translate-x-[-40%] translate-y-[20%]" />
              <div className="absolute top-0 right-0 w-full h-full border-[30px] border-zinc-500 rounded-full translate-x-[40%] translate-y-[-20%]" />
            </div>

            {/* Vertical Slots */}
            <div className="w-full flex flex-col items-center justify-center relative py-6 space-y-6 select-none">
              
              {/* Divider lines mirroring screenshot */}
              <div className="absolute top-[28%] left-0 right-0 h-[1px] bg-zinc-800/40" />
              <div className="absolute bottom-[28%] left-0 right-0 h-[1px] bg-zinc-800/40" />

              {/* Row 1: Previous (smaller, faded, blurry) */}
              <div className="text-xs md:text-sm text-zinc-600 font-heading text-center line-clamp-1 opacity-30 filter blur-[0.5px] transition-all duration-75">
                {displayedTopics[0]}
              </div>

              {/* Row 2: Selected (large, bold, Playfair serif, white/off-white text) */}
              <div className={`text-base md:text-2xl font-heading text-center font-bold px-4 transition-all duration-75 ${
                isSpinning ? 'opacity-40 blur-[1px] scale-95 text-zinc-400' : 'opacity-100 scale-100 text-zinc-50 font-[family-name:var(--font-playfair)] italic'
              }`}>
                {displayedTopics[1]}
              </div>

              {/* Row 3: Next (smaller, faded, blurry) */}
              <div className="text-xs md:text-sm text-zinc-600 font-heading text-center line-clamp-1 opacity-30 filter blur-[0.5px] transition-all duration-75">
                {displayedTopics[2]}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mt-12 w-full max-w-md relative z-10">
              <button
                onClick={spinDemo}
                disabled={isSpinning}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#c084fc] hover:bg-[#a855f7] text-zinc-950 font-bold rounded-full px-8 py-3.5 text-base shadow-[0_0_30px_rgba(192,132,252,0.25)] hover:shadow-[0_0_40px_rgba(192,132,252,0.4)] hover:scale-[1.03] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isSpinning ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Spinning...</span>
                  </>
                ) : (
                  <>
                    <span className="text-lg">✨</span>
                    <span>Spin</span>
                  </>
                )}
              </button>

              <Link
                href="/pricing"
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-1 font-bold rounded-full px-8 py-3.5 text-base transition-all border ${
                  hasSpun
                    ? "bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-100 hover:scale-[1.03] active:scale-[0.98]"
                    : "bg-zinc-900/40 border-zinc-800 text-zinc-500 cursor-not-allowed pointer-events-none"
                }`}
              >
                Unlock my analysis →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SECTION 3: FINAL CTA ═════════════════════════════════ */}
      <section className="relative px-6 py-32 flex flex-col items-center text-center overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[50%] h-[80%] rounded-full bg-[#7c3aed]/12 blur-[120px]" />
        </div>
        <h2 className="relative text-4xl sm:text-5xl font-bold text-zinc-50 max-w-2xl mx-auto leading-tight mb-6">
          Your voice is the{" "}
          <span className="font-[family-name:var(--font-playfair)] italic text-[#c084fc]">sharpest tool</span>{" "}
          you own.
        </h2>
        <p className="relative text-lg text-zinc-400 max-w-md mx-auto mb-10">
          Start a challenge today. Speak better tomorrow.
        </p>
        <Link
          href="/pricing"
          className="relative inline-flex items-center gap-2 bg-white text-zinc-950 font-bold rounded-full px-10 py-4 text-base shadow-[0_0_40px_rgba(255,255,255,0.18)] hover:shadow-[0_0_60px_rgba(255,255,255,0.28)] hover:scale-[1.03] transition-all"
        >
          Pick your challenge →
        </Link>
        <p className="relative mt-4 text-xs text-zinc-600">
          Card saved now. Only charged at the end — minus what you earned back.
        </p>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-sm font-bold text-zinc-600">
          Off The Cuff<span className="text-[#c084fc]">.</span>
        </span>
        <div className="flex gap-6 text-xs text-zinc-600">
          <Link href="/pricing" className="hover:text-zinc-300 transition-colors">Pricing</Link>
          <Link href="/login" className="hover:text-zinc-300 transition-colors">Sign In</Link>
        </div>
      </footer>

    </main>
  );
}
