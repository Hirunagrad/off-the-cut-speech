"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { createCheckoutSession } from "../actions/stripe";
import { useState } from "react";

type ChallengeType = '7-day' | '14-day';

const CHALLENGES = [
  {
    type: '7-day' as ChallengeType,
    title: '7-Day Challenge',
    price: '$20',
    earn: 'earn up to $7 back',
    cta: 'Start 7-Day Sprint →',
  },
  {
    type: '14-day' as ChallengeType,
    title: '14-Day Challenge',
    price: '$30',
    earn: 'earn up to $14 back',
    cta: 'Start 14-Day Sprint →',
  },
];

export default function PricingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loadingType, setLoadingType] = useState<ChallengeType | null>(null);

  const handleStart = async (challengeType: ChallengeType) => {
    if (!user) {
      router.push("/login");
      return;
    }

    setLoadingType(challengeType);
    try {
      const { url } = await createCheckoutSession(user.uid, challengeType);
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Failed to create checkout session:", error);
      setLoadingType(null);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center px-6 py-24">

      {/* Header */}
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-5xl md:text-6xl font-bold text-zinc-50 tracking-tight">
          Start your{' '}
          <span className="font-heading italic text-[#c084fc]">challenge</span>
        </h1>
        <p className="text-lg text-zinc-400 max-w-md mx-auto">
          Pick a sprint. Complete every day and earn $1 per day back.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
        {CHALLENGES.map((challenge) => (
          <div
            key={challenge.type}
            className="group bg-zinc-900 border border-zinc-800 hover:border-[#c084fc]/40 rounded-2xl p-8 flex flex-col gap-6 transition-all duration-300 hover:shadow-[0_0_40px_rgba(192,132,252,0.08)] cursor-pointer"
            onClick={() => handleStart(challenge.type)}
          >
            <div className="space-y-1">
              <h2 className="text-2xl font-heading font-bold text-zinc-50">
                {challenge.title}
              </h2>
              <p className="text-zinc-400 text-sm">
                {challenge.price} · {challenge.earn}
              </p>
            </div>

            <button
              className="text-left text-[#c084fc] font-semibold text-base group-hover:underline underline-offset-4 transition-all disabled:opacity-50"
              onClick={(e) => { e.stopPropagation(); handleStart(challenge.type); }}
              disabled={loadingType !== null}
            >
              {loadingType === challenge.type ? 'Loading...' : challenge.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Footer disclaimer */}
      <p className="mt-10 text-sm text-zinc-600 max-w-md text-center">
        Your card is saved now but charged only at the end — price minus $1 for every day you complete.
      </p>
    </div>
  );
}
