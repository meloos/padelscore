"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Trophy,
  Plus,
  CheckCircle,
  Flag,
  ArrowLeft,
  Swords,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Leaderboard } from "@/components/tournament/leaderboard";
import { MatchCard } from "@/components/tournament/match-card";
import { ScoreForm } from "@/components/tournament/score-form";
import { AdminScoreEdit } from "@/components/tournament/admin-score-edit";
import { AdminPlayerAssign } from "@/components/tournament/admin-player-assign";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";

interface TournamentPlayer {
  id: string;
  userId?: string | null;
  displayName: string;
  totalPoints: number;
  wins: number;
  losses: number;
  roundsPlayed: number;
  eloRating?: number;
}

interface MatchData {
  id: string;
  roundId: string;
  team1Player1Id: string;
  team1Player2Id: string;
  team2Player1Id: string;
  team2Player2Id: string;
  team1Score: number | null;
  team2Score: number | null;
  status: string;
}

interface RoundData {
  id: string;
  roundNumber: number;
  status: string;
  matches?: MatchData[];
}

interface TournamentData {
  id: string;
  name: string;
  type: string;
  status: string;
  fairWaiting: boolean;
  players: TournamentPlayer[];
  rounds: RoundData[];
}

export default function TournamentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.isAdmin;
  const [tournament, setTournament] = useState<TournamentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/tournaments/${id}`);
    if (!res.ok) {
      router.push("/dashboard");
      return;
    }
    setTournament(await res.json());
    setLoading(false);
  }, [id, router]);

  // SSE for live leaderboard and round state updates
  useEffect(() => {
    const es = new EventSource(`/api/tournaments/${id}/events`);

    es.onmessage = (e) => {
      const data = JSON.parse(e.data) as TournamentData;
      setTournament(data);
      setLoading(false);
    };

    es.onerror = () => {
      es.close();
      load();
    };

    return () => es.close();
  }, [id, load]);

  const playerMap = Object.fromEntries(
    tournament?.players.map((p) => [p.id, p]) ?? []
  );

  const activeRound = tournament?.rounds.find((r) => r.status === "active");
  const completedRounds = tournament?.rounds.filter(
    (r) => r.status === "completed"
  );

  async function startNextRound() {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${id}/rounds`, {
        method: "POST",
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      await load();
      toast({ title: "Round started!", description: "New pairs have been drawn." });
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function completeTournament() {
    if (!confirm("End the tournament and show final standings?")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${id}/complete`, {
        method: "POST",
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      const data = await res.json();
      await load();
      toast({
        title: "Tournament complete!",
        description: `Winner: ${data.winner}`,
      });
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        Loading tournament…
      </div>
    );
  }

  if (!tournament) return null;

  const isCompleted = tournament.status === "completed";
  const multiCourt = (activeRound?.matches?.length ?? 0) > 1;

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black">{tournament.name}</h1>
            <Badge variant={tournament.type === "mexicano" ? "default" : "secondary"}>
              {tournament.type}
            </Badge>
            <Badge variant={isCompleted ? "success" : "accent"}>
              {isCompleted ? "Completed" : "Active"}
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <p className="text-muted-foreground text-sm">
              {tournament.rounds.length} round
              {tournament.rounds.length !== 1 ? "s" : ""} played
              {tournament.players.length > 4 && ` · ${tournament.players.length} players`}
            </p>
            <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2">
              <a href={`/api/tournaments/${id}/scorecard`} download>
                <Download className="w-3.5 h-3.5" />
                PDF scorecard
              </a>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                {isCompleted ? "Final standings" : "Live standings"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Leaderboard players={tournament.players} completed={isCompleted} />
            </CardContent>
          </Card>

          {isAdmin && (
            <AdminPlayerAssign
              players={tournament.players}
              onSaved={load}
            />
          )}

          {!isCompleted && (
            <div className="flex gap-3">
              {!activeRound && (
                <Button
                  onClick={startNextRound}
                  disabled={actionLoading}
                  className="flex-1"
                >
                  <Plus className="w-4 h-4" />
                  Start round {(tournament.rounds.length ?? 0) + 1}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={completeTournament}
                disabled={actionLoading || !!activeRound}
                className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10"
              >
                <Flag className="w-4 h-4" />
                End tournament
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Active round — one card per court */}
          {activeRound?.matches && activeRound.matches.length > 0 && (
            activeRound.matches.map((match, courtIdx) => (
              <Card key={match.id} className="border-accent/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Swords className="w-5 h-5 text-accent" />
                    Round {activeRound.roundNumber}
                    {multiCourt && ` — Court ${courtIdx + 1}`}
                    {match.status !== "completed" && " — Enter score"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <MatchCard
                    roundNumber={activeRound.roundNumber}
                    team1={[
                      playerMap[match.team1Player1Id]?.displayName,
                      playerMap[match.team1Player2Id]?.displayName,
                    ]}
                    team2={[
                      playerMap[match.team2Player1Id]?.displayName,
                      playerMap[match.team2Player2Id]?.displayName,
                    ]}
                    team1Score={match.team1Score}
                    team2Score={match.team2Score}
                    status={match.status}
                  />
                  {match.status !== "completed" && (
                    <ScoreForm
                      tournamentId={id}
                      roundId={activeRound.id}
                      matchId={match.id}
                      team1={[
                        playerMap[match.team1Player1Id]?.displayName,
                        playerMap[match.team1Player2Id]?.displayName,
                      ]}
                      team2={[
                        playerMap[match.team2Player1Id]?.displayName,
                        playerMap[match.team2Player2Id]?.displayName,
                      ]}
                      onScoreSubmitted={load}
                    />
                  )}
                </CardContent>
              </Card>
            ))
          )}

          {/* Completed rounds */}
          {completedRounds && completedRounds.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-bold text-lg">Completed rounds</h2>
              {[...completedRounds].reverse().map((round) => {
                const roundMatches = round.matches ?? [];
                const multiCourtRound = roundMatches.length > 1;
                return (
                  <div key={round.id} className="space-y-2">
                    {roundMatches.map((match, courtIdx) => (
                      <div key={match.id}>
                        <MatchCard
                          roundNumber={round.roundNumber}
                          courtLabel={multiCourtRound ? `Court ${courtIdx + 1}` : undefined}
                          team1={[
                            playerMap[match.team1Player1Id]?.displayName,
                            playerMap[match.team1Player2Id]?.displayName,
                          ]}
                          team2={[
                            playerMap[match.team2Player1Id]?.displayName,
                            playerMap[match.team2Player2Id]?.displayName,
                          ]}
                          team1Score={match.team1Score}
                          team2Score={match.team2Score}
                          status={round.status}
                        />
                        {isAdmin && match.team1Score !== null && (
                          <div className="px-4 pb-2">
                            <AdminScoreEdit
                              roundId={round.id}
                              matchId={match.id}
                              currentTeam1Score={match.team1Score!}
                              currentTeam2Score={match.team2Score!}
                              team1Names={[
                                playerMap[match.team1Player1Id]?.displayName,
                                playerMap[match.team1Player2Id]?.displayName,
                              ]}
                              team2Names={[
                                playerMap[match.team2Player1Id]?.displayName,
                                playerMap[match.team2Player2Id]?.displayName,
                              ]}
                              onSaved={load}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
