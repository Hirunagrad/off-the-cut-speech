"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc, collection, query, orderBy, getDocs } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user) {
      const fetchUserData = async () => {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
          
          const q = query(collection(db, `users/${user.uid}/sessions`), orderBy("date", "desc"));
          const sessionDocs = await getDocs(q);
          const sessionsData = sessionDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setSessions(sessionsData);
        } catch (e) {
          console.error("Error fetching data:", e);
        }
      };
      fetchUserData();
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-zinc-100">Dashboard</h1>
            <p className="text-zinc-400 mt-1">Welcome back, {user.displayName || user.email}</p>
          </div>
          <Button variant="outline" onClick={handleSignOut} className="border-zinc-700 hover:bg-zinc-800 text-zinc-300">
            Sign Out
          </Button>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          
          {/* Profile Card */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-zinc-300">
                <p><span className="font-medium text-zinc-500">Email:</span> {user.email}</p>
                <p><span className="font-medium text-zinc-500">Role:</span> <span className="uppercase text-violet-400 font-bold">{userData?.role || 'free'}</span></p>
                {user.emailVerified ? (
                  <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-400 ring-1 ring-inset ring-green-500/20">Verified</span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-400 ring-1 ring-inset ring-yellow-500/20">Unverified</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Gamification Card */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle>Gamification</CardTitle>
              <CardDescription>Your practice consistency</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-2">
                <div className="text-6xl font-extrabold text-orange-500 mb-2 drop-shadow-md">
                  🔥 {userData?.streak_count || 0}
                </div>
                <p className="text-sm font-medium text-zinc-400 uppercase tracking-widest">Day Streak!</p>
              </div>
            </CardContent>
          </Card>

          {/* Action Card */}
          {userData?.role === 'free' ? (
            <Card className="bg-zinc-900/50 border-violet-500/50 flex flex-col justify-center items-center text-center p-6 lg:col-span-1 md:col-span-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-8 mt-4 w-32 bg-violet-600 text-white text-xs font-bold px-3 py-1 transform rotate-45 text-center shadow-md">
                PRO
              </div>
              <h3 className="text-xl font-semibold text-zinc-200 mb-2 mt-2">Unlock Unlimited Practice</h3>
              <p className="text-zinc-400 text-sm mb-6">Upgrade to Pro to practice as much as you want and get advanced AI feedback.</p>
              <div className="flex w-full gap-3">
                <Button variant="outline" className="w-1/2 border-zinc-700 text-zinc-300 hover:bg-zinc-800" onClick={() => router.push('/practice')}>
                  Practice
                </Button>
                <Button className="w-1/2 bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20" onClick={() => router.push('/pricing')}>
                  Upgrade
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="bg-zinc-900/50 border-emerald-500/30 flex flex-col justify-center items-center text-center p-6 lg:col-span-1 md:col-span-2">
              <div className="text-4xl mb-3">🏆</div>
              <h3 className="text-xl font-semibold text-emerald-400 mb-2">Pro Member</h3>
              <p className="text-zinc-400 text-sm mb-6">You have unlimited practice sessions. Keep up the great work!</p>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white w-full shadow-lg shadow-emerald-500/20" onClick={() => router.push('/practice')}>
                Start Practicing
              </Button>
            </Card>
          )}

          {/* Recent Activity Table */}
          <Card className="bg-zinc-900/50 border-zinc-800 lg:col-span-3">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your past practice sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="rounded-full bg-zinc-800 p-4 mb-4">
                    <svg className="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <p className="text-zinc-400 mb-4">No practice sessions yet. Your history will appear here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-zinc-800">
                  <table className="w-full text-sm text-left text-zinc-300">
                    <thead className="text-xs text-zinc-400 uppercase bg-zinc-800/80">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Date</th>
                        <th className="px-6 py-4 font-semibold text-emerald-400">Score</th>
                        <th className="px-6 py-4 font-semibold text-amber-400">Filler Words</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {sessions.map((session) => (
                        <tr key={session.id} className="hover:bg-zinc-800/40 transition-colors">
                          <td className="px-6 py-4">
                            {session.date ? new Date(session.date.seconds * 1000).toLocaleString(undefined, {
                              year: 'numeric', month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            }) : 'Just now'}
                          </td>
                          <td className="px-6 py-4 font-bold text-emerald-300">{session.confidenceScore}</td>
                          <td className="px-6 py-4 font-bold text-amber-300">{session.fillerWordsCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
