import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], style: ['normal', 'italic'], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "Off The Cuff Speech",
  description: "Your ultimate SaaS platform for spontaneous speech mastery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${playfair.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-[#09090b] text-zinc-50 relative antialiased overflow-x-hidden">
        {/* Global Ambient Glow System */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-950/20 blur-[140px] opacity-70" />
          <div className="absolute top-[35%] right-[-15%] w-[700px] h-[700px] rounded-full bg-indigo-950/15 blur-[150px] opacity-60" />
          <div className="absolute bottom-[-15%] left-[15%] w-[600px] h-[600px] rounded-full bg-fuchsia-950/10 blur-[130px] opacity-50" />
        </div>

        <AuthProvider>
          <Navbar />
          <div className="pt-16 flex flex-col flex-1 relative z-10">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
