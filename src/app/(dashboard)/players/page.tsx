"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal, BarChart3, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Player {
  id: string;
  name: string;
  email: string;
  totalPoints: number;
  totalWins: number;
  totalLosses: number;
  tournamentsPlayed: number;
  tournamentsWon: number;
}

const rankStyles = [
  "border-yellow-500/40 bg-yellow-500/10 shadow-lg shadow-yellow-500/10",
  "border-slate-400/30 bg-slate-500/10",
  "border-amber-700/30 bg-amber-800/10",
];

const rankIcons = [
  <Trophy key="1" className="w-5 h-5 text-yellow-400" />,
  <Medal key="2" className="w-5 h-5 text-slate-300" />,
  <Medal key="3" className="w-5 h-5 text-amber-600" />,
];

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/players")
      .then((r) => r.json())
      .then((data) => {
        const sorted = [...(Array.isArray(data) ? data : [])].sort(
          (a, b) => (b.totalPoints ?? 0) - (a.totalPoints ?? 0)
        );
        setPlayers(sorted);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black">Global Rankings</h1>
        <p className="text-muted-foreground mt-1">
          All-time stats for registered players
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">
          Loading players…
        </div>
      ) : players.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-16 h-16 text-muted/50 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No registered players yet</h2>
          <p className="text-muted-foreground">
            Players need to create an account to appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {players.map((player, i) => (
            <Card
              key={player.id}
              className={cn(
                "transition-all",
                i < 3 ? rankStyles[i] : "border-border"
              )}
            >
              <CardContent className="py-4 px-5 flex items-center gap-5">
                <div className="w-10 h-10 rounded-full border-2 border-muted flex items-center justify-center shrink-0 text-lg font-black">
                  {i < 3 ? rankIcons[i] : <span className="text-muted-foreground text-base">{i + 1}</span>}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-lg truncate">{player.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{player.email}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-right">
                  <div>
                    <p className="text-xs text-muted-foreground">Pts</p>
                    <p className="font-black text-base sm:text-xl text-primary">
                      {player.totalPoints ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">W/L</p>
                    <p className="font-mono font-bold text-sm sm:text-base">
                      {player.totalWins ?? 0}/{player.totalLosses ?? 0}
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs text-muted-foreground">Tourneys</p>
                    <p className="font-mono font-bold">{player.tournamentsPlayed ?? 0}</p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs text-muted-foreground">Won</p>
                    <p className="font-mono font-bold text-yellow-400">
                      {player.tournamentsWon ?? 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
