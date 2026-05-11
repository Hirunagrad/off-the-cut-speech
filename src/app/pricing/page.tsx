"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { createCheckoutSession } from "../actions/stripe";
import { useState } from "react";

export default function PricingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    setIsLoading(true);
    try {
      const { url } = await createCheckoutSession(user.uid);
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Failed to create checkout session:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-100">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Choose the plan that's right for you. Improve your speaking skills with AI-powered feedback.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <Card className="bg-zinc-900/50 border-zinc-800 flex flex-col">
            <CardHeader>
              <CardTitle className="text-2xl">Free Tier</CardTitle>
              <CardDescription>Perfect for getting started</CardDescription>
              <div className="mt-4 flex items-baseline text-5xl font-extrabold text-zinc-100">
                $0
                <span className="ml-1 text-xl font-medium text-zinc-400">/mo</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-4 text-zinc-300">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-500 mr-2 shrink-0" />
                  <span>Real-time speech transcription</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-500 mr-2 shrink-0" />
                  <span>Basic Gemini AI feedback</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-500 mr-2 shrink-0" />
                  <span className="font-semibold text-white">Limited to 1 practice per day</span>
                </li>
                <li className="flex items-center opacity-50">
                  <X className="h-5 w-5 text-zinc-500 mr-2 shrink-0" />
                  <span>Unlimited practice sessions</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                onClick={() => router.push(user ? "/dashboard" : "/login")}
              >
                {user ? "Go to Dashboard" : "Get Started"}
              </Button>
            </CardFooter>
          </Card>

          {/* Pro Tier */}
          <Card className="bg-zinc-900/50 border-violet-500/50 shadow-lg shadow-violet-500/10 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-8 mt-4 w-32 bg-violet-600 text-white text-xs font-bold px-3 py-1 transform rotate-45 text-center">
              POPULAR
            </div>
            <CardHeader>
              <CardTitle className="text-2xl text-violet-400">Pro Tier</CardTitle>
              <CardDescription>For serious improvement</CardDescription>
              <div className="mt-4 flex items-baseline text-5xl font-extrabold text-zinc-100">
                $10
                <span className="ml-1 text-xl font-medium text-zinc-400">/mo</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-4 text-zinc-300">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-500 mr-2 shrink-0" />
                  <span>Real-time speech transcription</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-500 mr-2 shrink-0" />
                  <span>Advanced Gemini AI feedback</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-500 mr-2 shrink-0" />
                  <span className="font-semibold text-white">Unlimited practice sessions</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-500 mr-2 shrink-0" />
                  <span>Priority support</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                onClick={handleUpgrade}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Upgrade to Pro"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
