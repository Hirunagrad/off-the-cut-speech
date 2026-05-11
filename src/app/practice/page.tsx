'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Square, Loader2, Trophy, AlertCircle, Lightbulb, Activity } from "lucide-react";
import { analyzeSpeech } from '../actions/analyze';
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp, getDoc } from "firebase/firestore";

export default function PracticeRoom() {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [transcript, setTranscript] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [results, setResults] = useState<{
    confidenceScore: number;
    fillerWordsCount: number;
    improvementTips: string[];
  } | null>(null);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef("");

  useEffect(() => {
    if (user) {
      getDoc(doc(db, "users", user.uid)).then(d => {
        if (d.exists()) setUserData(d.data());
      });
    }
  }, [user]);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        transcriptRef.current = currentTranscript;
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error !== 'no-speech') {
           stopRecording();
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    
    setTranscript("");
    transcriptRef.current = "";
    setResults(null);
    setTimeLeft(60);
    setIsRecording(true);
    
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error("Failed to start recognition:", e);
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAnalysis = async () => {
    if (!transcriptRef.current.trim()) {
      return; 
    }
    setIsAnalyzing(true);
    try {
      const data = await analyzeSpeech(transcriptRef.current);
      setResults(data);

      if (user) {
        await addDoc(collection(db, `users/${user.uid}/sessions`), {
          date: serverTimestamp(),
          transcript: transcriptRef.current,
          confidenceScore: data.confidenceScore,
          fillerWordsCount: data.fillerWordsCount,
          improvementTips: data.improvementTips
        });

        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          streak_count: increment(1),
          last_practice_date: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recognitionRef.current) recognitionRef.current.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    handleAnalysis();
  };

  const hasPracticedToday = userData?.last_practice_date?.toDate().toDateString() === new Date().toDateString();
  const isFreeAndBlocked = userData?.role === 'free' && hasPracticedToday;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12 flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-8">
        
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Practice Room
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400">
            Speak naturally. We'll analyze your delivery in real-time.
          </p>
        </div>

        {/* Main Recording Area */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 w-full" />
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-6xl font-mono tracking-tighter text-slate-800 dark:text-slate-100 py-4">
              00:{timeLeft.toString().padStart(2, '0')}
            </CardTitle>
            <CardDescription className="text-base">
              {isRecording ? "Recording in progress..." : "Ready when you are. Up to 60 seconds."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-6 pb-8">
            {isFreeAndBlocked ? (
              <div className="flex flex-col items-center space-y-4 p-4 text-center">
                <AlertCircle className="w-12 h-12 text-amber-500" />
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Daily Limit Reached</h3>
                <p className="text-slate-600 dark:text-slate-400 max-w-md">
                  You're on the Free tier and have already completed your practice session for today. Upgrade to Pro for unlimited practice!
                </p>
                <Button 
                  className="bg-violet-600 hover:bg-violet-700 text-white mt-2"
                  onClick={() => window.location.href = '/pricing'}
                >
                  Upgrade to Pro
                </Button>
              </div>
            ) : (
              <div className="flex gap-4">
                {!isRecording ? (
                  <Button 
                    size="lg" 
                    className="rounded-full w-48 h-14 text-lg gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
                    onClick={startRecording}
                    disabled={isAnalyzing}
                  >
                    <Mic className="w-5 h-5" />
                    Start Speaking
                  </Button>
                ) : (
                  <Button 
                    size="lg" 
                    variant="destructive"
                    className="rounded-full w-48 h-14 text-lg gap-2 shadow-lg shadow-red-500/30 transition-all animate-pulse"
                    onClick={stopRecording}
                  >
                    <Square className="w-5 h-5 fill-current" />
                    Finish
                  </Button>
                )}
              </div>
            )}

            {/* Live Transcript Area */}
            <div className="w-full mt-8">
              <div className="flex items-center gap-2 mb-2 px-1">
                <Activity className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Live Transcript</span>
              </div>
              <div className="w-full h-40 bg-slate-100 dark:bg-slate-900 rounded-xl p-4 overflow-y-auto border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 leading-relaxed shadow-inner">
                {transcript || (
                  <span className="text-slate-400 dark:text-slate-500 italic">
                    Your speech will appear here...
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-in fade-in zoom-in duration-300">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <h3 className="text-xl font-medium text-slate-700 dark:text-slate-200">
              Gemini is analyzing your speech...
            </h3>
            <p className="text-slate-500">Evaluating confidence, counting filler words, and generating tips.</p>
          </div>
        )}

        {/* Results Area */}
        {results && !isAnalyzing && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-8 duration-500">
            
            <Card className="border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <Trophy className="w-5 h-5" />
                  <CardTitle className="text-lg">Confidence</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-bold text-emerald-700 dark:text-emerald-300">
                  {results.confidenceScore}<span className="text-2xl text-emerald-500/70">/100</span>
                </div>
                <p className="text-sm text-emerald-600/80 mt-2">Overall delivery score</p>
              </CardContent>
            </Card>

            <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-5 h-5" />
                  <CardTitle className="text-lg">Filler Words</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-bold text-amber-700 dark:text-amber-300">
                  {results.fillerWordsCount}
                </div>
                <p className="text-sm text-amber-600/80 mt-2">Um, ah, like, you know</p>
              </CardContent>
            </Card>

            <Card className="md:col-span-3 border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Lightbulb className="w-5 h-5" />
                  <CardTitle className="text-lg">AI Feedback</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mt-2">
                  {results.improvementTips.map((tip, idx) => (
                    <li key={idx} className="flex gap-3 text-indigo-900 dark:text-indigo-200 bg-white/60 dark:bg-slate-900/40 p-4 rounded-lg shadow-sm">
                      <div className="w-6 h-6 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <span className="text-base leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

          </div>
        )}

      </div>
    </div>
  );
}
