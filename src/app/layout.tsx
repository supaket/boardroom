import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Enersys AI Boardroom",
  description: "One-Person Company powered by 41 AI Agents",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${inter.variable} dark`}>
      <body className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
