"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useRouter, usePathname } from "next/navigation";

// Pages that already have their own full nav — skip the global bar there
const EXCLUDED_PATHS = ["/onboarding"];

export default function Navbar() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Don't render on excluded pages (they have their own nav)
  if (EXCLUDED_PATHS.includes(pathname)) return null;

  const handleSignOut = async () => {
    router.replace("/");
    setTimeout(async () => {
      try {
        await signOut(auth);
      } catch (err) {
        console.error("Sign out error:", err);
      }
    }, 150);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-8 py-4 backdrop-blur-md bg-zinc-950/80 border-b border-white/5">
      {/* Logo → always goes to root */}
      <Link
        href="/"
        className="font-heading font-bold text-zinc-100 text-lg hover:text-white transition-colors"
      >
        Off the Cuff<span className="text-[#c084fc]">.</span>
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {user ? (
          <>
            {pathname !== "/dashboard" && (
              <Link
                href="/dashboard"
                className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                Dashboard
              </Link>
            )}
            <button
              onClick={handleSignOut}
              className="text-sm text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-600 rounded-full px-4 py-1.5 transition-all"
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-semibold bg-white text-zinc-950 rounded-full px-5 py-2 hover:bg-zinc-100 transition-all"
            >
              Get Started →
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
