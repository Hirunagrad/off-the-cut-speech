'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Square, Loader2, Trophy, AlertCircle, Lightbulb, Activity, Play, RotateCcw, Send } from "lucide-react";
import { analyzeSpeech } from '../actions/analyze';
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp, getDoc } from "firebase/firestore";
import { sounds } from "@/lib/sound";

const TOPICS = {
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
    "Modern music lacks the depth of past decades."
  ],
  Health: [
    "Mental health days should be treated the same as sick days.", 
    "Universal healthcare is a fundamental human right.", 
    "Performance-enhancing drugs should be allowed in pro sports."
  ]
};

interface FlaggedWord {
  word: string;
  type: "filler" | "hedge" | "strong";
}

interface ScoreMetric {
  score: number;
  feedback: string;
}

interface AnalysisResults {
  scores: {
    clarity: ScoreMetric;
    fillerRate: ScoreMetric;
    confidence: ScoreMetric;
  };
  biggestImprovement: string;
  flaggedWords: FlaggedWord[];
}

export default function PracticeRoom() {
  const { user } = useAuth();
  
  // Topic States
  const [currentTopic, setCurrentTopic] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [displayedTopic, setDisplayedTopic] = useState<string>("Ready to spin?");

  // Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [hasFinishedRecording, setHasFinishedRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [transcript, setTranscript] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // User Data & Results
  const [userData, setUserData] = useState<any>(null);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Custom Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Loading Progress State
  const [loadingProgress, setLoadingProgress] = useState(0);

  // PREP Planning State
  const [isPrepPlanning, setIsPrepPlanning] = useState(false);
  const [prepDuration, setPrepDuration] = useState(60); // seconds
  const [prepTimeLeft, setPrepTimeLeft] = useState(60);
  const [prepRunning, setPrepRunning] = useState(false);
  const [prepExpanded, setPrepExpanded] = useState(false);
  const prepTimerRef = useRef<NodeJS.Timeout | null>(null);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [audioURL, setAudioURL] = useState<string | null>(null);

  const renderHighlightedTranscript = (transcriptText: string, flaggedWords: FlaggedWord[]) => {
    if (!flaggedWords || flaggedWords.length === 0) return <span>{transcriptText}</span>;

    const wordMap = new Map<string, string>();
    flaggedWords.forEach(fw => {
      wordMap.set(fw.word.toLowerCase(), fw.type);
    });

    const wordsAndPunctuation = transcriptText.split(/(\b[\w']+\b)/i);

    return (
      <p className="text-xl md:text-2xl leading-relaxed text-zinc-300 font-serif">
        {wordsAndPunctuation.map((segment, idx) => {
          const type = wordMap.get(segment.toLowerCase());
          
          if (type === 'filler') {
            return <span key={idx} className="underline decoration-red-500/80 decoration-wavy text-red-200 cursor-help" title="Filler Word">{segment}</span>;
          } else if (type === 'hedge') {
            return <span key={idx} className="italic text-yellow-300/90 cursor-help" title="Hedge Word">{segment}</span>;
          } else if (type === 'strong') {
            return <span key={idx} className="font-bold text-purple-400 cursor-help" title="Strong Vocabulary">{segment}</span>;
          }

          return <span key={idx}>{segment}</span>;
        })}
      </p>
    );
  };

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
      if (recognitionRef.current) recognitionRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const spinForTopic = () => {
    setIsSpinning(true);
    setCurrentTopic(null);
    setResults(null);
    setHasFinishedRecording(false);
    
    let availableTopics: string[] = [];
    if (selectedCategory && TOPICS[selectedCategory as keyof typeof TOPICS]) {
      availableTopics = TOPICS[selectedCategory as keyof typeof TOPICS];
    } else {
      availableTopics = Object.values(TOPICS).flat();
    }

    const finalTopic = availableTopics[Math.floor(Math.random() * availableTopics.length)];
    
    let spins = 0;
    const maxSpins = 18;
    let delay = 50; // starts fast

    const runSpin = () => {
      spins++;
      const randomTopic = availableTopics[Math.floor(Math.random() * availableTopics.length)];
      setDisplayedTopic(randomTopic);
      
      // Play high-fidelity click on every slot step
      sounds.playTick();

      if (spins >= maxSpins) {
        // Smoothly settle and reveal
        setDisplayedTopic(finalTopic);
        setTimeout(() => {
          setCurrentTopic(finalTopic);
          setIsSpinning(false);
          // Play premium ascending celebratory arpeggio chime
          sounds.playReveal();
        }, 400);
      } else {
        // Organic deceleration: increase delay as it approaches the end
        if (spins > 14) {
          delay += 75; // slow down heavily
        } else if (spins > 8) {
          delay += 35; // slow down moderately
        }
        setTimeout(runSpin, delay);
      }
    };

    setTimeout(runSpin, delay);
  };

  const startRecording = async () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    
    // Play cool digital mic click sound
    sounds.playMicClick();

    setTranscript("");
    transcriptRef.current = "";
    setResults(null);
    setTimeLeft(60);
    setIsRecording(true);
    setHasFinishedRecording(false);
    setAudioURL(null);
    audioChunksRef.current = [];
    
    try {
      recognitionRef.current.start();
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
      };

      mediaRecorder.start();

    } catch (e) {
      console.error("Failed to start recording:", e);
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

  const stopRecording = () => {
    // Play warm stop tone
    sounds.playStopRecording();

    setIsRecording(false);
    setHasFinishedRecording(true);
    if (recognitionRef.current) recognitionRef.current.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      // Stop all tracks to release the microphone
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleAnalysis = async () => {
    // Sync ref from state in case recognition committed late
    const finalTranscript = transcriptRef.current.trim() || transcript.trim();
    transcriptRef.current = finalTranscript;

    setAnalysisError(null);

    if (!finalTranscript) {
      setAnalysisError("No speech detected. Please try recording again.");
      return;
    }
    if (!currentTopic) {
      setAnalysisError("No topic selected. Please spin for a topic first.");
      return;
    }
    
    setIsAnalyzing(true);
    setLoadingProgress(0);
    
    const loadingInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10 + 5;
      });
    }, 400);

    try {
      const data = await analyzeSpeech(finalTranscript, currentTopic);
      setResults(data);
      // Play premium success chime
      sounds.playSuccess();

      if (user) {
        await addDoc(collection(db, `users/${user.uid}/sessions`), {
          date: serverTimestamp(),
          topic: currentTopic,
          transcript: finalTranscript,
          scores: data.scores,
          biggestImprovement: data.biggestImprovement,
          flaggedWords: data.flaggedWords
        });

        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          streak_count: increment(1),
          last_practice_date: serverTimestamp()
        });
      }
    } catch (error: any) {
      console.error("Analysis failed:", error);
      setAnalysisError("Analysis failed. Please try again.");
    } finally {
      clearInterval(loadingInterval);
      setLoadingProgress(100);
      setTimeout(() => {
        setIsAnalyzing(false);
      }, 300);
    }
  };

  const redoSpeech = () => {
    setHasFinishedRecording(false);
    setTranscript("");
    transcriptRef.current = "";
    setTimeLeft(60);
    setAudioURL(null);
    setAudioProgress(0);
    setIsPlaying(false);
  };

  const startPrepTimer = () => {
    setPrepRunning(true);
    prepTimerRef.current = setInterval(() => {
      setPrepTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(prepTimerRef.current!);
          setPrepRunning(false);
          // Play stop alarm sound
          sounds.playStopRecording();
          return 0;
        }
        // Play subtle tick on each countdown step
        sounds.playCountdownTick();
        return prev - 1;
      });
    }, 1000);
  };

  const resetPrepTimer = () => {
    if (prepTimerRef.current) clearInterval(prepTimerRef.current);
    setPrepRunning(false);
    setPrepTimeLeft(prepDuration);
  };

  const selectPrepDuration = (secs: number) => {
    if (prepTimerRef.current) clearInterval(prepTimerRef.current);
    setPrepRunning(false);
    setPrepDuration(secs);
    setPrepTimeLeft(secs);
  };

  const enterPrepMode = () => {
    setPrepTimeLeft(prepDuration);
    setPrepRunning(false);
    setIsPrepPlanning(true);
  };

  const exitPrepToRecord = () => {
    if (prepTimerRef.current) clearInterval(prepTimerRef.current);
    setIsPrepPlanning(false);
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setAudioProgress(audioRef.current.currentTime);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setAudioProgress(0);
  };

  const hasPracticedToday = userData?.last_practice_date?.toDate().toDateString() === new Date().toDateString();
  const isFreeAndBlocked = userData?.role === 'free' && hasPracticedToday;

  if (isFreeAndBlocked) {
    return (
      <div className="min-h-screen bg-transparent p-6 md:p-12 flex flex-col items-center justify-center">
        <Card className="max-w-md w-full bg-zinc-900 border-zinc-800 p-8 text-center space-y-6">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto" />
          <h3 className="text-2xl font-bold font-heading text-zinc-50">Daily Limit Reached</h3>
          <p className="text-zinc-400">
            You're on the Free tier and have already completed your practice session for today. Upgrade to Pro for unlimited impromptu challenges!
          </p>
          <Button 
            size="lg"
            className="w-full font-bold"
            onClick={() => window.location.href = '/pricing'}
          >
            Upgrade to Pro
          </Button>
        </Card>
      </div>
    );
  }

  // ── Results view: full-width layout matching session detail page ──────────
  if (results && !isAnalyzing) {
    return (
      <div className="min-h-screen bg-transparent px-6 py-12 md:px-12">

        {/* Back button */}
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="fixed top-5 left-5 z-50 flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 rounded-full px-4 py-2 backdrop-blur-sm transition-all"
        >
          ← Dashboard
        </button>

        <div className="max-w-5xl mx-auto pt-8 space-y-8 animate-in slide-in-from-bottom-8 duration-500">

          {/* Header */}
          <div className="space-y-2">
            <p className="text-xs font-bold tracking-widest uppercase text-zinc-500">Session Review</p>
            <h1 className="text-3xl font-heading font-bold text-zinc-50 leading-tight">
              {currentTopic}
            </h1>
            <p className="text-sm text-zinc-500">
              {new Date().toLocaleString(undefined, {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>

          {/* Row 1: Transcript | Coach Feedback */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Transcript */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-bold tracking-widest uppercase text-zinc-500 px-1">Your Transcript</p>
              <div className="bg-[#18181b] border border-zinc-800/50 rounded-2xl p-8 flex flex-col gap-6 h-full">
                <div>
                  {renderHighlightedTranscript(transcriptRef.current, results.flaggedWords)}
                </div>
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
                  <Lightbulb className="w-5 h-5" />
                  <span className="font-bold tracking-wide uppercase text-xs">Biggest Room for Improvement</span>
                </div>
                <p className="italic text-zinc-200 leading-relaxed text-xl flex-1">
                  "{results.biggestImprovement}"
                </p>
                <div className="flex flex-col gap-3 mt-auto">
                  <Button
                    onClick={() => window.location.reload()}
                    className="w-full bg-[#c084fc] hover:bg-[#a855f7] text-zinc-950 font-bold rounded-full py-3"
                  >
                    Practice Another Topic
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/dashboard'}
                    className="w-full border-zinc-700 hover:bg-zinc-800 text-zinc-300 rounded-full bg-transparent"
                  >
                    Dashboard
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: 3 Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12">
            {[
              { label: "Clarity",     score: results.scores.clarity.score,     feedback: results.scores.clarity.feedback,     color: "#c084fc" },
              { label: "Filler Rate", score: results.scores.fillerRate.score,   feedback: results.scores.fillerRate.feedback,   color: "#facc15" },
              { label: "Confidence",  score: results.scores.confidence.score,   feedback: results.scores.confidence.feedback,   color: "#f97316" },
            ].map(({ label, score, feedback, color }) => (
              <div key={label} className="bg-[#18181b] border border-zinc-800/50 rounded-2xl p-6 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-zinc-200">{label}</span>
                  <span className="text-3xl font-heading font-bold" style={{ color }}>{score}</span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${score}%`, backgroundColor: color }} />
                </div>
                <p className="text-sm text-zinc-400 mt-1">{feedback}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-6 md:p-12 flex flex-col items-center pt-24">

      {/* Back to Dashboard */}
      <button
        onClick={() => window.location.href = '/dashboard'}
        className="fixed top-5 left-5 z-50 flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 rounded-full px-4 py-2 backdrop-blur-sm transition-all"
      >
        ← Dashboard
      </button>
      
      {/* PHASE 1: SPIN FOR TOPIC */}
      {!currentTopic ? (

        <div className="flex flex-col items-center w-full max-w-4xl mx-auto space-y-12 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center space-y-6">
            <h1 className="text-5xl md:text-7xl font-heading font-bold text-zinc-50 tracking-tight">
              Spin for a <span className="italic text-primary">topic</span>
            </h1>
            <p className="text-lg text-zinc-400 max-w-xl mx-auto">
              Every day of the challenge starts like this — pick categories, spin, and you've got sixty seconds to speak.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3">
            {Object.keys(TOPICS).map(cat => (
              <Button 
                key={cat} 
                variant={selectedCategory === cat ? "default" : "outline"}
                className={`rounded-full px-6 py-2 border-zinc-800 transition-colors ${selectedCategory !== cat ? 'bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400' : 'bg-zinc-800 text-zinc-50'}`}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              >
                {cat}
              </Button>
            ))}
          </div>

          <Card className="w-full max-w-2xl bg-zinc-900/80 border-zinc-800/80 p-12 min-h-[300px] flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
            <div className={`text-2xl md:text-3xl font-heading text-center font-bold text-zinc-200 transition-all duration-75 ${isSpinning ? 'opacity-50 blur-[1px] scale-95' : 'opacity-100 scale-100'}`}>
               {displayedTopic}
            </div>
            
            <div className="absolute bottom-8 flex flex-col items-center space-y-4">
              <Button 
                size="lg" 
                className="rounded-full px-10 h-12 text-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all hover:scale-105"
                onClick={spinForTopic}
                disabled={isSpinning}
              >
                {isSpinning ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "✨ Spin"}
                {isSpinning ? "Spinning..." : ""}
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        /* PHASE 2: RECORDING UI */
        <div className="flex flex-col items-center w-full max-w-3xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          <div className="text-center flex flex-col items-center">
            <span className="text-xs font-bold tracking-widest uppercase text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-8 inline-block">
              Today's Prompt — {selectedCategory || "Random"}
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-zinc-50 leading-tight">
              {currentTopic}
            </h1>
          </div>

          {!results && !isAnalyzing && (
            <div className="w-full max-w-xl flex flex-col items-center space-y-8 mt-4">
              
              {!hasFinishedRecording ? (
                <div className="flex flex-col items-center space-y-8 w-full animate-in fade-in zoom-in-95 duration-500">

                  {/* ── PREP Planning Mode ── */}
                  {isPrepPlanning ? (
                    <div className="flex flex-col items-center gap-7 w-full animate-in fade-in zoom-in-95 duration-400">

                      {/* Duration selector */}
                      <div className="flex gap-2 bg-zinc-900 border border-zinc-800 rounded-full p-1">
                        {[{label:'30s', secs:30}, {label:'1 min', secs:60}, {label:'2 min', secs:120}].map(({label, secs}) => (
                          <button
                            key={secs}
                            onClick={() => selectPrepDuration(secs)}
                            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                              prepDuration === secs
                                ? 'bg-[#c084fc] text-zinc-950'
                                : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      {/* Circular timer */}
                      <div className="relative w-52 h-52 flex items-center justify-center">
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="46" fill="none" stroke="#27272a" strokeWidth="4"/>
                          <circle
                            cx="50" cy="50" r="46" fill="none"
                            stroke="#c084fc" strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 46}`}
                            strokeDashoffset={`${2 * Math.PI * 46 * (1 - prepTimeLeft / prepDuration)}`}
                            className="transition-all duration-1000 ease-linear"
                          />
                        </svg>
                        <div className="text-center z-10">
                          <p className="text-5xl font-heading font-bold text-zinc-50">
                            {Math.floor(prepTimeLeft / 60)}:{(prepTimeLeft % 60).toString().padStart(2, '0')}
                          </p>
                          <p className="text-xs font-bold tracking-widest uppercase text-zinc-500 mt-1">
                            {prepRunning ? 'Planning' : prepTimeLeft === 0 ? 'Done!' : 'Ready'}
                          </p>
                        </div>
                      </div>

                      {/* Play / Reset buttons */}
                      <div className="flex items-center gap-4">
                        <button
                          onClick={prepRunning ? () => { clearInterval(prepTimerRef.current!); setPrepRunning(false); } : startPrepTimer}
                          disabled={prepTimeLeft === 0}
                          className="w-14 h-14 rounded-full bg-[#c084fc] hover:bg-[#a855f7] flex items-center justify-center shadow-[0_0_30px_rgba(192,132,252,0.3)] transition-all disabled:opacity-40"
                        >
                          {prepRunning
                            ? <Square className="w-5 h-5 text-zinc-950 fill-current" />
                            : <Play className="w-5 h-5 text-zinc-950 ml-0.5 fill-current" />}
                        </button>
                        <button
                          onClick={resetPrepTimer}
                          className="w-11 h-11 rounded-full border border-zinc-700 hover:border-zinc-500 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-all"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>

                      {/* PREP Structure accordion */}
                      <div className="w-full border border-zinc-800 rounded-2xl overflow-hidden">
                        <button
                          onClick={() => setPrepExpanded(!prepExpanded)}
                          className="w-full flex items-center justify-between px-6 py-4 bg-zinc-900/80 text-xs font-bold tracking-widest uppercase text-zinc-400 hover:text-zinc-200 transition-colors"
                        >
                          <span>Structure with PREP</span>
                          <span className={`transition-transform duration-200 ${prepExpanded ? 'rotate-180' : ''}`}>▾</span>
                        </button>
                        {prepExpanded && (
                          <div className="bg-zinc-900/40 px-6 pb-6 pt-2 grid grid-cols-2 gap-4 animate-in fade-in duration-200">
                            {[
                              { letter:'P', title:'Point', desc:'State your main stance clearly up front.', color:'#c084fc' },
                              { letter:'R', title:'Reason', desc:'Give the core reason behind your point.', color:'#818cf8' },
                              { letter:'E', title:'Example', desc:'Back it up with a specific example.', color:'#38bdf8' },
                              { letter:'P', title:'Point', desc:'Close by restating your position.', color:'#c084fc' },
                            ].map((step, i) => (
                              <div key={i} className="flex gap-3 items-start">
                                <span className="w-8 h-8 rounded-full flex items-center justify-center font-heading font-bold text-sm shrink-0 bg-zinc-800" style={{ color: step.color }}>
                                  {step.letter}
                                </span>
                                <div>
                                  <p className="font-bold text-zinc-200 text-sm">{step.title}</p>
                                  <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{step.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* I'm ready to record */}
                      <button
                        onClick={exitPrepToRecord}
                        className="w-full py-4 bg-zinc-100 hover:bg-white text-zinc-950 font-bold rounded-full text-lg transition-all shadow-lg"
                      >
                        I'm ready to record
                      </button>
                    </div>

                  ) : (
                    /* ── Normal recording UI ── */
                    <>
                  <div className="text-8xl font-heading font-bold text-zinc-50 tracking-tight">
                    {timeLeft === 60 ? '1:00' : `0:${timeLeft.toString().padStart(2, '0')}`}
                  </div>
                  
                  <button 
                    className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse shadow-[0_0_40px_rgba(239,68,68,0.4)]' : 'bg-[#c084fc] hover:bg-[#a855f7] shadow-[0_0_50px_rgba(192,132,252,0.25)]'}`}
                    onClick={isRecording ? stopRecording : startRecording}
                  >
                    {isRecording ? <Square className="w-10 h-10 text-white fill-current" /> : <Mic className="w-12 h-12 text-zinc-950" />}
                  </button>

                  <p className="text-zinc-400 text-lg">
                    {isRecording ? "Recording in progress. Tap to stop." : "You have 60 seconds. Tap to start."}
                  </p>

                  {!isRecording && (
                    <Button variant="outline" onClick={enterPrepMode} className="rounded-full border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-300 px-6 mt-4">
                      <Activity className="w-4 h-4 mr-2" /> Plan with PREP first
                    </Button>
                  )}
                    </>
                  )}
                </div>
              ) : (
                <div className="w-full flex flex-col space-y-10 animate-in fade-in zoom-in-95 duration-500">
                  {/* Custom Audio Player Match Screenshot */}
                  <div className="w-full bg-[#18181b] border border-zinc-800/50 rounded-full p-2 pr-6 flex items-center gap-4 shadow-2xl">
                    <button 
                      onClick={toggleAudio}
                      className="w-12 h-12 rounded-full bg-[#c084fc] flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(192,132,252,0.3)] transition-all hover:scale-105"
                    >
                      {isPlaying ? <Square className="w-4 h-4 text-zinc-950 fill-current" /> : <Play className="w-5 h-5 text-zinc-950 ml-1 fill-current" />}
                    </button>
                    
                    <div className="flex-1 flex items-center gap-4 px-2">
                      <span className="text-sm text-zinc-500 font-mono">
                        0:{Math.floor(audioProgress).toString().padStart(2, '0')}
                      </span>
                      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden relative">
                         <div 
                           className="absolute top-0 left-0 h-full bg-zinc-500 transition-all duration-100 ease-linear" 
                           style={{ width: `${(audioProgress / 60) * 100}%` }}
                         />
                      </div>
                      <span className="text-sm text-zinc-500 font-mono">0:60</span>
                    </div>

                    {/* Hidden Audio Element */}
                    <audio 
                      ref={audioRef} 
                      src={audioURL || undefined} 
                      onTimeUpdate={handleTimeUpdate}
                      onEnded={handleAudioEnded}
                      className="hidden" 
                    />
                  </div>

                  <div className="flex flex-col space-y-4 pt-4 px-4">
                    <Button 
                      size="lg" 
                      className="w-full h-14 text-lg bg-zinc-100 hover:bg-white text-zinc-900 font-bold rounded-full shadow-lg"
                      onClick={handleAnalysis}
                    >
                      <Send className="w-5 h-5 mr-2" />
                      Get Analysis
                    </Button>

                    {/* Error message */}
                    {analysisError && (
                      <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {analysisError}
                      </div>
                    )}

                    <Button 
                      size="lg" 
                      variant="outline"
                      className="w-full h-14 text-lg border-zinc-800 hover:bg-zinc-900 text-zinc-300 rounded-full"
                      onClick={redoSpeech}
                    >
                      <RotateCcw className="w-5 h-5 mr-2" />
                      Redo Speech
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {isAnalyzing && (
            <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-in fade-in duration-300 w-full max-w-md mx-auto">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <div className="w-full space-y-2">
                <p className="text-center text-lg font-heading text-zinc-200">Scoring your clarity...</p>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-primary rounded-full transition-all duration-500 ease-out" 
                     style={{ width: `${loadingProgress}%` }}
                   />
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
