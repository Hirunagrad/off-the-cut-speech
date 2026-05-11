"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, collection, query, orderBy, getDocs } from "firebase/firestore";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

interface UserData {
  email?: string;
  role?: string;
  streak_count?: number;
  activeChallenge?: string | null;
}

interface Session {
  id: string;
  date?: { seconds: number };
  topic?: string;
  scores?: {
    clarity?: { score: number };
    fillerRate?: { score: number };
    confidence?: { score: number };
  };
}

// Custom tooltip for the chart
const ChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-xs shadow-xl">
        <p className="text-zinc-400 mb-2 font-semibold">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }} className="font-bold">
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) { router.push("/login"); return; }
    if (user) {
      const fetchData = async () => {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) setUserData(userDoc.data() as UserData);
          const q = query(collection(db, `users/${user.uid}/sessions`), orderBy("date", "desc"));
          const snap = await getDocs(q);
          setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Session[]);
        } catch (e) { console.error("Error fetching data:", e); }
        finally { setDataLoading(false); }
      };
      fetchData();
    }
  }, [user, loading, router]);


  if (loading || dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#c084fc]" />
      </div>
    );
  }
  if (!user) return null;

  const streakCount = userData?.streak_count ?? 0;
  const role = userData?.role ?? "free";
  const activeChallenge = userData?.activeChallenge;

  // Build chart data from sessions (oldest → newest)
  const chartData = [...sessions].reverse().map((s, i) => ({
    name: `#${i + 1}`,
    label: s.topic ? s.topic.slice(0, 20) + "…" : `Session ${i + 1}`,
    Clarity: s.scores?.clarity?.score ?? 0,
    "Filler Rate": s.scores?.fillerRate?.score ?? 0,
    Confidence: s.scores?.confidence?.score ?? 0,
  }));

  return (
    <div className="min-h-screen bg-transparent px-6 py-12 md:px-12">
      <div className="max-w-5xl mx-auto space-y-10">


        {/* ── Top Grid ───────────────────────────────────────────── */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Card 1: Profile & Challenge */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
            <p className="text-xs font-bold tracking-widest uppercase text-zinc-500">Your Plan</p>
            <div className="flex items-center gap-3">
              <span className="text-4xl">👤</span>
              <div>
                <p className="text-zinc-400 text-sm">Role</p>
                <p className={`text-xl font-heading font-bold uppercase ${role === "pro" ? "text-[#c084fc]" : "text-zinc-300"}`}>
                  {role}
                </p>
              </div>
            </div>
            {activeChallenge ? (
              <div className="mt-auto bg-[#c084fc]/10 border border-[#c084fc]/20 rounded-xl px-4 py-3 flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <p className="text-xs text-[#c084fc] font-bold uppercase tracking-wide">Sprint Active</p>
                  <p className="text-zinc-200 font-semibold capitalize">{activeChallenge} Challenge</p>
                </div>
              </div>
            ) : (
              <div className="mt-auto bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3">
                <p className="text-zinc-500 text-sm">No active challenge.</p>
                <button onClick={() => router.push("/pricing")} className="text-[#c084fc] text-sm font-semibold mt-1 hover:underline">
                  Start a Sprint →
                </button>
              </div>
            )}
          </div>

          {/* Card 2: Streak */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-32 h-32 rounded-full bg-orange-500/10 blur-3xl" />
            </div>
            <p className="text-xs font-bold tracking-widest uppercase text-zinc-500 self-start">Streak</p>
            <div className="flex items-center gap-3">
              <span className="text-6xl drop-shadow-[0_0_20px_rgba(249,115,22,0.6)]">🔥</span>
              <span className="text-8xl font-heading font-extrabold text-orange-400 leading-none">{streakCount}</span>
            </div>
            <p className="text-zinc-400 text-sm mt-2">
              {streakCount > 0 ? "Practice today to keep it alive!" : "Start practicing to build your streak!"}
            </p>
          </div>

          {/* Card 3: CTA */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between gap-6">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-zinc-500 mb-3">Ready to speak?</p>
              <h2 className="text-2xl font-heading font-bold text-zinc-50 leading-tight">
                Your next session <span className="italic text-[#c084fc]">awaits.</span>
              </h2>
              <p className="text-zinc-500 text-sm mt-2">Spin a topic, record 60 seconds, and get instant AI coaching.</p>
            </div>
            <button
              onClick={() => router.push("/practice")}
              className="w-full py-4 rounded-full bg-[#c084fc] hover:bg-[#a855f7] text-zinc-950 font-bold text-lg transition-all shadow-[0_0_30px_rgba(192,132,252,0.35)] hover:shadow-[0_0_50px_rgba(192,132,252,0.5)] hover:scale-[1.02]"
            >
              Enter Practice Room →
            </button>
          </div>
        </div>

        {/* ── Progress Chart ─────────────────────────────────────── */}
        {sessions.length >= 2 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <div className="mb-6">
              <p className="text-xs font-bold tracking-widest uppercase text-zinc-500 mb-1">Progress</p>
              <h2 className="text-xl font-heading font-bold text-zinc-50">Your Improvement Over Time</h2>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "#71717a", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }}
                  formatter={(value) => <span style={{ color: "#a1a1aa" }}>{value}</span>}
                />
                <Line type="monotone" dataKey="Clarity" stroke="#c084fc" strokeWidth={2} dot={{ fill: "#c084fc", r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Filler Rate" stroke="#facc15" strokeWidth={2} dot={{ fill: "#facc15", r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Confidence" stroke="#f97316" strokeWidth={2} dot={{ fill: "#f97316", r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Recent Sessions ────────────────────────────────────── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-zinc-500 mb-1">History</p>
              <h2 className="text-xl font-heading font-bold text-zinc-50">Recent Sessions</h2>
            </div>
            {sessions.length > 0 && (
              <span className="text-xs text-zinc-600 border border-zinc-800 rounded-full px-3 py-1">
                {sessions.length} session{sessions.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <p className="text-zinc-500 text-base">Your practice history will appear here.</p>
              <button onClick={() => router.push("/practice")} className="text-[#c084fc] text-sm font-semibold hover:underline">
                Record your first session →
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-zinc-800">
              <table className="w-full text-sm text-left">
                <thead className="text-xs font-bold uppercase tracking-wider text-zinc-500 bg-zinc-800/60">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Topic</th>
                    <th className="px-6 py-4 text-[#c084fc]">Clarity</th>
                    <th className="px-6 py-4 text-yellow-400">Filler Rate</th>
                    <th className="px-6 py-4 text-orange-400">Confidence</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80">
                  {sessions.map((session) => (
                    <tr
                      key={session.id}
                      onClick={() => router.push(`/dashboard/session/${session.id}`)}
                      className="hover:bg-zinc-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 text-zinc-400 whitespace-nowrap">
                        {session.date
                          ? new Date(session.date.seconds * 1000).toLocaleString(undefined, {
                              year: "numeric", month: "short", day: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })
                          : "Just now"}
                      </td>
                      <td className="px-6 py-4 text-zinc-300 max-w-[200px] truncate" title={session.topic}>
                        {session.topic || "—"}
                      </td>
                      <td className="px-6 py-4 font-bold text-[#c084fc]">{session.scores?.clarity?.score ?? "—"}</td>
                      <td className="px-6 py-4 font-bold text-yellow-300">{session.scores?.fillerRate?.score ?? "—"}</td>
                      <td className="px-6 py-4 font-bold text-orange-300">{session.scores?.confidence?.score ?? "—"}</td>
                      <td className="px-6 py-4 text-zinc-600 group-hover:text-[#c084fc] transition-colors text-right">
                        View →
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
