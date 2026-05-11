import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="relative flex flex-col flex-1 items-center justify-center overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-background" />
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/20 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/20 blur-[120px]" />
      
      <main className="relative z-10 flex flex-col items-center justify-center text-center px-6 sm:px-12 w-full max-w-5xl">
        <div className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-sm font-medium text-zinc-300 backdrop-blur-sm mb-8">
          <span className="flex h-2 w-2 rounded-full bg-violet-500 mr-2 animate-pulse"></span>
          Now accepting early access
        </div>
        
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-zinc-100 to-zinc-500 mb-6 drop-shadow-sm">
          Master the Art of <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-500">Spontaneous Speech</span>
        </h1>
        
        <p className="mt-4 max-w-2xl text-lg sm:text-xl text-zinc-400 mb-10 leading-relaxed">
          The ultimate platform designed to refine your impromptu speaking skills. 
          Practice, get AI-driven feedback, and build confidence for any situation.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link href="/login">
            <Button size="lg" className="w-full sm:w-auto rounded-full px-8 bg-white text-black hover:bg-zinc-200 transition-all font-semibold">
              Get Started for Free
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-full px-8 border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-100 backdrop-blur-md">
              Sign In
            </Button>
          </Link>
        </div>
      </main>
      
      {/* Decorative glassmorphism element */}
      <div className="absolute top-[20%] right-[10%] w-64 h-64 bg-white/5 border border-white/10 rounded-3xl rotate-12 backdrop-blur-lg -z-10 hidden lg:block" />
      <div className="absolute bottom-[20%] left-[10%] w-48 h-48 bg-white/5 border border-white/10 rounded-full -rotate-12 backdrop-blur-lg -z-10 hidden lg:block" />
    </div>
  );
}
