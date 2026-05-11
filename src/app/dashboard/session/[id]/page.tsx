"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";

interface FlaggedWord {
  word: string;
  type: "filler" | "hedge" | "strong";
}

interface Session {
  topic?: string;
  transcript?: string;
  date?: { seconds: number };
  scores?: {
    clarity?: { score: number; feedback: string };
    fillerRate?: { score: number; feedback: string };
    confidence?: { score: number; feedback: string };
  };
  biggestImprovement?: string;
  flaggedWords?: FlaggedWord[];
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-1000 ease-out"
        style={{ width: `${score}%`, backgroundColor: color }}
      />
    </div>
  );
}

function renderHighlightedTranscript(text: string, flaggedWords: FlaggedWord[] = []) {
  if (!flaggedWords.length) return <span>{text}</span>;
  const wordMap = new Map<string, string>();
  flaggedWords.forEach(fw => wordMap.set(fw.word.toLowerCase(), fw.type));
  const tokens = text.split(/(\b[\w']+\b)/i);
  return (
    <p className="text-lg leading-relaxed text-zinc-300 font-serif">
      {tokens.map((seg, i) => {
        const type = wordMap.get(seg.toLowerCase());
        if (type === "filler") return <span key={i} className="underline decoration-red-500/80 decoration-wavy text-red-200">{seg}</span>;
        if (type === "hedge") return <span key={i} className="italic text-yellow-300/90">{seg}</span>;
        if (type === "strong") return <span key={i} className="font-bold text-purple-400">{seg}</span>;
        return <span key={i}>{seg}</span>;
      })}
    </p>
  );
}

export default function SessionDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) { router.push("/login"); return; }
    if (user && sessionId) {
      getDoc(doc(db, `users/${user.uid}/sessions`, sessionId))
        .then(snap => { if (snap.exists()) setSession(snap.data() as Session); })
        .catch(e => console.error(e))
        .finally(() => setFetching(false));
    }
  }, [user, loading, sessionId, router]);

  if (loading || fetching) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#c084fc]" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent flex-col gap-4">
        <p className="text-zinc-400">Session not found.</p>
        <button onClick={() => router.push("/dashboard")} className="text-[#c084fc] hover:underline text-sm">← Back to Dashboard</button>
      </div>
    );
  }

  const scores = session.scores;

  return (
    <div className="min-h-screen bg-transparent px-6 py-12 md:px-12">
      {/* Back button */}
      <button
        onClick={() => router.push("/dashboard")}
        className="fixed top-5 left-5 z-50 flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 rounded-full px-4 py-2 backdrop-blur-sm transition-all"
      >
        ← Dashboard
      </button>

      <div className="max-w-5xl mx-auto pt-8 space-y-8">

        {/* Header */}
        <div className="space-y-2">
          <p className="text-xs font-bold tracking-widest uppercase text-zinc-500">Session Review</p>
          <h1 className="text-3xl font-heading font-bold text-zinc-50 leading-tight">
            {session.topic || "Untitled Session"}
          </h1>
          {session.date && (
            <p className="text-sm text-zinc-500">
              {new Date(session.date.seconds * 1000).toLocaleString(undefined, {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </p>
          )}
        </div>

        {/* Row 1: Transcript | Coach Feedback */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Transcript */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold tracking-widest uppercase text-zinc-500 px-1">Your Transcript</p>
            <div className="bg-[#18181b] border border-zinc-800/50 rounded-2xl p-8 flex flex-col gap-6 h-full">
              {session.transcript
                ? renderHighlightedTranscript(session.transcript, session.flaggedWords)
                : <p className="text-zinc-500 italic">No transcript saved.</p>
              }
              {/* Legend */}
              <div className="flex flex-wrap gap-6 pt-6 border-t border-zinc-800/50 text-xs font-semibold uppercase tracking-wider mt-auto">
                <div className="flex items-center gap-2 text-zinc-400"><span className="w-3 h-3 rounded-full bg-red-500/50" /> Filler</div>
                <div className="flex items-center gap-2 text-zinc-400"><span className="w-3 h-3 rounded-full bg-yellow-400/50" /> Hedge</div>
                <div className="flex items-center gap-2 text-zinc-400"><span className="w-3 h-3 rounded-full bg-purple-500/50" /> Strong</div>
              </div>
            </div>
          </div>

          {/* Coach Feedback */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold tracking-widest uppercase text-zinc-500 px-1">Coach Feedback</p>
            <div className="bg-[#c084fc]/10 border border-[#c084fc]/20 rounded-2xl p-8 flex flex-col gap-6 h-full">
              <div className="flex items-center gap-2 text-[#c084fc]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="font-bold tracking-wide uppercase text-xs">Biggest Room for Improvement</span>
              </div>
              <p className="italic text-zinc-200 leading-relaxed text-xl flex-1">
                "{session.biggestImprovement || "No coaching note saved."}"
              </p>
              <button
                onClick={() => router.push("/practice")}
                className="w-full py-3 rounded-full bg-[#c084fc] hover:bg-[#a855f7] text-zinc-950 font-bold transition-all"
              >
                Practice Again →
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Clarity", key: "clarity", color: "#c084fc" },
            { label: "Filler Rate", key: "fillerRate", color: "#facc15" },
            { label: "Confidence", key: "confidence", color: "#f97316" },
          ].map(({ label, key, color }) => {
            const metric = scores?.[key as keyof typeof scores];
            return (
              <div key={key} className="bg-[#18181b] border border-zinc-800/50 rounded-2xl p-6 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-zinc-200">{label}</span>
                  <span className="text-3xl font-heading font-bold" style={{ color }}>
                    {metric?.score ?? "—"}
                  </span>
                </div>
                {metric?.score !== undefined && <ScoreBar score={metric.score} color={color} />}
                <p className="text-sm text-zinc-400 mt-1">{metric?.feedback ?? "No feedback."}</p>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
