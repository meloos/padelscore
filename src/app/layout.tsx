import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "PadelScore — Mexicano Tournament Tracker",
  description: "Create, run, and track Mexicano padel tournaments with automatic pair generation, live leaderboards, and player statistics.",
  openGraph: {
    title: "PadelScore — Mexicano Tournament Tracker",
    description: "Create, run, and track Mexicano padel tournaments with automatic pair generation, live leaderboards, and player statistics.",
    type: "website",
    url: "https://padelscore.home.melek.solutions",
  },
  twitter: {
    card: "summary_large_image",
    title: "PadelScore — Mexicano Tournament Tracker",
    description: "Create, run, and track Mexicano padel tournaments with automatic pair generation, live leaderboards, and player statistics.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
