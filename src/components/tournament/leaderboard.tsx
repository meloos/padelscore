"use client";

import { Trophy, Medal, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Player {
  id: string;
  displayName: string;
  totalPoints: number;
  wins: number;
  losses: number;
  roundsPlayed: number;
}

interface LeaderboardProps {
  players: Player[];
  completed?: boolean;
}

const rankColors = [
  "text-yellow-400 bg-yellow-500/20 border-yellow-500/30",
  "text-slate-300 bg-slate-500/20 border-slate-500/30",
  "text-amber-600 bg-amber-800/20 border-amber-700/30",
  "text-muted-foreground bg-muted/20 border-muted/30",
];

const rankIcons = [
  <Trophy key="1" className="w-4 h-4" />,
  <Medal key="2" className="w-4 h-4" />,
  <Medal key="3" className="w-4 h-4" />,
  <Star key="4" className="w-4 h-4" />,
];

export function Leaderboard({ players, completed = false }: LeaderboardProps) {
  const sorted = [...players].sort(
    (a, b) =>
      b.totalPoints - a.totalPoints ||
      b.wins - a.wins
  );

  return (
    <div className="space-y-2">
      {sorted.map((player, i) => (
        <div
          key={player.id}
          className={cn(
            "flex items-center gap-4 p-4 rounded-xl border transition-all",
            i === 0 && completed
              ? "border-yellow-500/40 bg-yellow-500/10 shadow-lg shadow-yellow-500/10"
              : "border-border bg-card"
          )}
        >
          <div
            className={cn(
              "w-8 h-8 rounded-full border flex items-center justify-center shrink-0",
              rankColors[i]
            )}
          >
            {rankIcons[i]}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{player.displayName}</p>
            <p className="text-xs text-muted-foreground">
              {player.roundsPlayed} round{player.roundsPlayed !== 1 ? "s" : ""} played
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">W / L</p>
              <p className="font-mono text-sm font-semibold">
                {player.wins} / {player.losses}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs text-muted-foreground">Points</p>
              <p className="font-mono text-xl font-bold text-primary">
                {player.totalPoints}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
