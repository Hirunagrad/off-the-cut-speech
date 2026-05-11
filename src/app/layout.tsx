import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

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
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-50">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
