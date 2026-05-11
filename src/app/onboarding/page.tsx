"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/config";
import { doc, updateDoc } from "firebase/firestore";

const TOTAL_STEPS = 5;

// ── Step components ──────────────────────────────────────────────────────────

function Step1() {
  return (
    <div className="flex flex-col items-center text-center gap-10 animate-in fade-in slide-in-from-bottom-6 duration-500">
      <h1 className="text-5xl md:text-6xl font-heading font-bold text-zinc-50 leading-tight max-w-xl">
        Public speaking is the{" "}
        <span className="text-[#c084fc]">#1 fear</span>{" "}
        in the world.
      </h1>
      <div>
        <p className="text-zinc-400 mb-6 text-sm">Ranked above:</p>
        <div className="flex gap-4 justify-center">
          {[
            { emoji: "🏔️", label: "Heights" },
            { emoji: "🕷️", label: "Spiders" },
            { emoji: "💀", label: "Death" },
          ].map(({ emoji, label }) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-2xl w-32 h-28 flex flex-col items-center justify-center gap-3">
              <span className="text-3xl">{emoji}</span>
              <span className="text-sm text-zinc-300 font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-2xl font-heading font-bold text-zinc-50">
        Almost no one teaches us how to get past it.
      </p>
    </div>
  );
}

function Step2({ selected, setSelected }: { selected: string[]; setSelected: (v: string[]) => void }) {
  const items = [
    { label: "Nerves & anxiety", icon: "🫀" },
    { label: "Going blank", icon: "🧠" },
    { label: "Filler words", icon: "🔇" },
    { label: "Eye contact", icon: "👁️" },
    { label: "Rambling", icon: "🌀" },
    { label: "Monotone voice", icon: "🎤" },
    { label: "Pacing", icon: "⏱️" },
  ];

  const toggle = (label: string) => {
    setSelected(selected.includes(label)
      ? selected.filter(s => s !== label)
      : [...selected, label]);
  };

  // Scattered sizes to match the bubble layout
  const sizes = ["w-36 h-36", "w-28 h-28", "w-32 h-32", "w-24 h-24", "w-28 h-28", "w-32 h-32", "w-24 h-24"];

  return (
    <div className="flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-zinc-50 mb-2">What holds you back?</h1>
        <p className="text-zinc-400">Pick all that apply.</p>
      </div>
      <div className="flex flex-wrap justify-center gap-4 max-w-lg">
        {items.map(({ label, icon }, i) => {
          const active = selected.includes(label);
          return (
            <button
              key={label}
              onClick={() => toggle(label)}
              className={`${sizes[i]} rounded-full flex flex-col items-center justify-center gap-2 transition-all border-2 text-sm font-semibold
                ${active
                  ? "bg-[#c084fc] border-[#c084fc] text-zinc-950 shadow-[0_0_30px_rgba(192,132,252,0.4)]"
                  : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-600"
                }`}
            >
              <span className="text-2xl">{icon}</span>
              <span className="text-center px-3 leading-tight">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Step3() {
  return (
    <div className="flex flex-col items-center gap-10 text-center animate-in fade-in slide-in-from-bottom-6 duration-500">
      <h1 className="text-4xl md:text-5xl font-heading font-bold text-zinc-50 leading-tight max-w-xl">
        Just{" "}
        <span className="text-[#c084fc]">1 min</span>{" "}
        a day to improve your articulation.
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
        {[
          {
            step: "Step 1",
            title: "One prompt a day",
            desc: "You get a topic. You have 60 seconds to talk about it.",
            visual: (
              <div className="h-16 flex items-center justify-center gap-1">
                {[2,4,3,6,4,5,3,4,6,5,3,2].map((h, i) => (
                  <div key={i} className="w-1 rounded-full bg-[#c084fc]/60" style={{ height: `${h * 5}px` }} />
                ))}
              </div>
            ),
          },
          {
            step: "Step 2",
            title: "Instant feedback",
            desc: "We measure your filler words, pacing, structure, and clarity.",
            visual: (
              <div className="h-16 flex flex-col justify-center gap-2 px-2">
                {[{l:"Filler",c:"#ef4444",w:70},{l:"Pacing",c:"#f97316",w:55},{l:"Clarity",c:"#c084fc",w:45}].map(m => (
                  <div key={m.l} className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 w-10 shrink-0">{m.l}</span>
                    <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${m.w}%`, backgroundColor: m.c }} />
                    </div>
                  </div>
                ))}
              </div>
            ),
          },
          {
            step: "Step 3",
            title: "Get $1 back every day",
            desc: "Every day you record, $1 comes back from your challenge fee. Show up, earn it back.",
            visual: (
              <div className="h-16 flex items-center justify-center">
                <div className="bg-zinc-800 rounded-xl px-4 py-2 text-center">
                  <span className="text-yellow-400 font-bold text-xl">+$1</span>
                  <span className="text-zinc-500 text-xs"> / DAY</span>
                </div>
              </div>
            ),
          },
        ].map(({ step, title, desc, visual }) => (
          <div key={step} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-left">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">{step}</p>
            {visual}
            <p className="font-bold text-zinc-100 mt-3 mb-1">{title}</p>
            <p className="text-xs text-zinc-400 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Step4({ pace, setPace, deadline, setDeadline }: {
  pace: string; setPace: (v: string) => void;
  deadline: string; setDeadline: (v: string) => void;
}) {
  const paceOptions = [
    { label: "5 min/day", sub: "light" },
    { label: "10 min/day", sub: "steady" },
    { label: "20 min/day", sub: "intensive" },
  ];
  const deadlineOptions = ["In 30 days", "2–3 months", "No deadline"];

  return (
    <div className="flex flex-col items-center gap-8 text-center animate-in fade-in slide-in-from-bottom-6 duration-500 w-full max-w-md mx-auto">
      <div>
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-zinc-50 mb-2">How often can you practice?</h1>
        <p className="text-zinc-400">Consistency beats intensity.</p>
      </div>
      <div className="flex flex-col gap-3 w-full">
        {paceOptions.map(({ label, sub }) => (
          <button
            key={label}
            onClick={() => setPace(label)}
            className={`flex items-center gap-4 w-full rounded-2xl border px-6 py-4 text-left transition-all
              ${pace === label
                ? "border-[#c084fc] bg-[#c084fc]/10 text-zinc-50"
                : "border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-600"
              }`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${pace === label ? "border-[#c084fc]" : "border-zinc-600"}`}>
              {pace === label && <div className="w-2.5 h-2.5 rounded-full bg-[#c084fc]" />}
            </div>
            <span className="font-semibold">{label}</span>
            <span className="text-zinc-500 text-sm">– {sub}</span>
          </button>
        ))}
      </div>
      <div className="w-full text-left">
        <p className="text-sm text-zinc-400 mb-3">Big moment coming up?</p>
        <div className="flex gap-2">
          {deadlineOptions.map(opt => (
            <button
              key={opt}
              onClick={() => setDeadline(opt)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all
                ${deadline === opt
                  ? "bg-[#c084fc] text-zinc-950"
                  : "bg-zinc-900 border border-zinc-700 text-zinc-300 hover:border-zinc-500"
                }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step5() {
  const days = [1,2,3,4,5,6,7,8,9,10,11,12,13,14];
  // Stagger positions to make it look like the reference screenshot
  const cols = [0,1,2,3,4,5,6,7,8,9,10,11,12,13];
  const rows = [0,0,0,1,1,1,1,1,1,1,1,1,1,1]; // Some at top, most at bottom

  return (
    <div className="flex flex-col items-center gap-8 text-center animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div>
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-zinc-50 leading-tight max-w-xl">
          <span className="text-[#c084fc]">Daily consistency</span>{" "}
          is key to improving communication.
        </h1>
        <p className="text-zinc-400 mt-3">$1 back every day you show up.</p>
      </div>

      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 overflow-hidden">
        <div className="flex flex-wrap gap-x-3 gap-y-5 items-end justify-start min-h-[100px] relative">
          {days.map((d, i) => {
            const isLate = i >= 9;
            return (
              <div
                key={d}
                className="flex flex-col items-center gap-1"
                style={{
                  opacity: isLate ? 1 : i < 3 ? 1 : 0.6,
                  transform: i < 3 ? "translateY(0)" : i < 6 ? "translateY(20px)" : i < 9 ? "translateY(10px)" : "translateY(0)",
                }}
              >
                <span className="text-[10px] font-bold text-zinc-500">D{d}</span>
                <span className={`text-sm font-bold ${isLate ? "text-yellow-400" : "text-yellow-400/60"}`}>+$1</span>
              </div>
            );
          })}
        </div>
        <div className="mt-6 pt-4 border-t border-zinc-800 text-center">
          <span className="text-zinc-400 text-sm">Complete all 14 days = </span>
          <span className="text-yellow-400 text-2xl font-heading font-bold">$14 back</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Onboarding Component ────────────────────────────────────────────────

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 2 state
  const [painPoints, setPainPoints] = useState<string[]>([]);
  // Step 4 state
  const [pace, setPace] = useState("");
  const [deadline, setDeadline] = useState("No deadline");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  const canContinue = () => {
    if (step === 2) return painPoints.length > 0;
    if (step === 4) return pace !== "";
    return true;
  };

  const handleContinue = async () => {
    if (step < TOTAL_STEPS) {
      setStep(s => s + 1);
      return;
    }
    // Final step — save to Firestore and go to pricing
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        onboardingComplete: true,
        onboardingData: { painPoints, pace, deadline },
      });
      router.push("/pricing");
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f11]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#c084fc]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f11] text-zinc-50 flex flex-col">

      {/* ── Top bar ── */}
      <div className="px-8 pt-6 pb-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-heading font-bold text-zinc-100 text-lg">Off the Cuff</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => step > 1 && setStep(s => s - 1)}
            className={`text-zinc-500 hover:text-zinc-200 transition-colors ${step === 1 ? "invisible" : ""}`}
          >
            ←
          </button>
          {/* Progress bar */}
          <div className="flex-1 flex gap-1.5">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-1 rounded-full transition-all duration-500 ${
                  i < step ? "bg-[#c084fc]" : "bg-zinc-800"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Step content ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-2xl">
          {step === 1 && <Step1 />}
          {step === 2 && <Step2 selected={painPoints} setSelected={setPainPoints} />}
          {step === 3 && <Step3 />}
          {step === 4 && <Step4 pace={pace} setPace={setPace} deadline={deadline} setDeadline={setDeadline} />}
          {step === 5 && <Step5 />}
        </div>
      </div>

      {/* ── Continue button ── */}
      <div className="flex justify-end px-8 pb-8">
        <button
          onClick={handleContinue}
          disabled={!canContinue() || saving}
          className={`flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold text-base transition-all
            ${canContinue() && !saving
              ? "bg-[#c084fc] hover:bg-[#a855f7] text-zinc-950 shadow-[0_0_30px_rgba(192,132,252,0.3)]"
              : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            }`}
        >
          {saving ? "Saving..." : step === TOTAL_STEPS ? "Pick my challenge →" : "Continue →"}
        </button>
      </div>

    </div>
  );
}
