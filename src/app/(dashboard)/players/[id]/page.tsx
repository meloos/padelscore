"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Swords, Trophy, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface MatchEntry {
  matchId: string;
  tournamentId: string;
  tournamentName: string;
  roundNumber: number;
  partner: string;
  partnerUserId: string | null;
  opponents: { name: string; userId: string | null }[];
  myScore: number;
  oppScore: number;
  won: boolean;
}

interface H2HEntry {
  name: string;
  userId: string | null;
  wins: number;
  losses: number;
}

interface PlayerDetail {
  id: string;
  name: string;
  email: string;
  stats: {
    totalPoints: number;
    totalWins: number;
    totalLosses: number;
    tournamentsPlayed: number;
    tournamentsWon: number;
    eloRating: number;
  } | null;
  matchHistory: MatchEntry[];
  headToHead: H2HEntry[];
}

export default function PlayerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [player, setPlayer] = useState<PlayerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/players/${id}`)
      .then((r) => {
        if (!r.ok) router.push("/players");
        return r.json();
      })
      .then(setPlayer)
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        Loading player…
      </div>
    );
  }

  if (!player) return null;

  const stats = player.stats;
  const winRate =
    stats && stats.totalWins + stats.totalLosses > 0
      ? Math.round((stats.totalWins / (stats.totalWins + stats.totalLosses)) * 100)
      : null;

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/players">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-black">{player.name}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{player.email}</p>
        </div>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">ELO Rating</p>
            <p className="text-3xl font-black text-primary">{stats?.eloRating ?? 1000}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Total Points</p>
            <p className="text-3xl font-black">{stats?.totalPoints ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
            <p className="text-3xl font-black text-green-400">
              {winRate !== null ? `${winRate}%` : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Tournaments</p>
            <p className="text-3xl font-black">{stats?.tournamentsPlayed ?? 0}</p>
            <p className="text-xs text-yellow-400">{stats?.tournamentsWon ?? 0} won</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Head-to-head */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Swords className="w-5 h-5 text-accent" />
              Head-to-Head
            </CardTitle>
          </CardHeader>
          <CardContent>
            {player.headToHead.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">No matches yet</p>
            ) : (
              <div className="space-y-2">
                {player.headToHead.map((h2h) => {
                  const total = h2h.wins + h2h.losses;
                  const pct = Math.round((h2h.wins / total) * 100);
                  return (
                    <div
                      key={h2h.userId ?? h2h.name}
                      className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        {h2h.userId ? (
                          <Link
                            href={`/players/${h2h.userId}`}
                            className="font-semibold hover:underline truncate block"
                          >
                            {h2h.name}
                          </Link>
                        ) : (
                          <p className="font-semibold truncate">{h2h.name}</p>
                        )}
                        <p className="text-xs text-muted-foreground">{total} match{total !== 1 ? "es" : ""}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono font-bold text-sm">
                          <span className="text-green-400">{h2h.wins}</span>
                          <span className="text-muted-foreground"> / </span>
                          <span className="text-red-400">{h2h.losses}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{pct}% win</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* W/L breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Career Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Wins</span>
              <span className="font-bold text-green-400">{stats?.totalWins ?? 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Losses</span>
              <span className="font-bold text-red-400">{stats?.totalLosses ?? 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Tournaments played</span>
              <span className="font-bold">{stats?.tournamentsPlayed ?? 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Tournaments won</span>
              <span className="font-bold text-yellow-400">{stats?.tournamentsWon ?? 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Match history */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Match History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {player.matchHistory.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">No matches played yet</p>
          ) : (
            <div className="space-y-2">
              {player.matchHistory.map((m) => (
                <div
                  key={m.matchId}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border text-sm",
                    m.won
                      ? "border-green-500/20 bg-green-500/5"
                      : "border-red-500/20 bg-red-500/5"
                  )}
                >
                  <Badge
                    variant={m.won ? "success" : "destructive"}
                    className="w-8 text-center shrink-0"
                  >
                    {m.won ? "W" : "L"}
                  </Badge>

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/tournaments/${m.tournamentId}`}
                      className="font-semibold hover:underline truncate block"
                    >
                      {m.tournamentName}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      Round {m.roundNumber} · with{" "}
                      {m.partnerUserId ? (
                        <Link href={`/players/${m.partnerUserId}`} className="hover:underline">
                          {m.partner}
                        </Link>
                      ) : (
                        m.partner
                      )}{" "}
                      · vs{" "}
                      {m.opponents.map((o, i) => (
                        <span key={i}>
                          {i > 0 && " & "}
                          {o.userId ? (
                            <Link href={`/players/${o.userId}`} className="hover:underline">
                              {o.name}
                            </Link>
                          ) : (
                            o.name
                          )}
                        </span>
                      ))}
                    </p>
                  </div>

                  <div className="text-right shrink-0 font-mono font-bold">
                    <span className={m.won ? "text-green-400" : "text-red-400"}>{m.myScore}</span>
                    <span className="text-muted-foreground">–</span>
                    <span>{m.oppScore}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
