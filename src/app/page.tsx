import Link from "next/link";
import { Trophy, Zap, Users, BarChart3, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="court-bg min-h-screen flex flex-col">
      <header className="max-w-6xl mx-auto w-full px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-primary" />
          </div>
          <span className="font-bold text-lg gradient-text">PadelScore</span>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/auth/login">Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/auth/register">Get started</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8">
          <Zap className="w-3 h-3" />
          Mexicano Format Support
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight mb-6 max-w-3xl">
          Your padel tournament,{" "}
          <span className="gradient-text">perfectly scored</span>
        </h1>

        <p className="text-base sm:text-xl text-muted-foreground max-w-xl mb-10 leading-relaxed">
          Create, run, and track Mexicano padel tournaments with automatic
          random pair generation, live leaderboards, and player statistics.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Button size="lg" className="gap-2" asChild>
            <Link href="/auth/register">
              Start a tournament
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/auth/login">Sign in</Link>
          </Button>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 max-w-3xl w-full">
          {[
            {
              icon: <Users className="w-6 h-6 text-primary" />,
              title: "4-player format",
              desc: "Add 4 players — registered or guests — and let the app handle the rest.",
            },
            {
              icon: <Zap className="w-6 h-6 text-accent" />,
              title: "Random pairings",
              desc: "Each round shuffles pairs from all 3 possible combinations automatically.",
            },
            {
              icon: <BarChart3 className="w-6 h-6 text-primary" />,
              title: "Global stats",
              desc: "Registered players accumulate stats across all tournaments.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="glass rounded-xl p-6 text-left hover:border-primary/30 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="font-bold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center py-6 text-sm text-muted-foreground border-t border-border">
        PadelScore · Mexicano tournament tracker
      </footer>
    </div>
  );
}
