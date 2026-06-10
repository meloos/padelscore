import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tournaments, tournamentPlayers, rounds, matches, playerStats } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [tournament] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.id, id));

  if (!tournament) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const playersRaw = await db
    .select({
      id: tournamentPlayers.id,
      tournamentId: tournamentPlayers.tournamentId,
      userId: tournamentPlayers.userId,
      displayName: tournamentPlayers.displayName,
      totalPoints: tournamentPlayers.totalPoints,
      wins: tournamentPlayers.wins,
      losses: tournamentPlayers.losses,
      roundsPlayed: tournamentPlayers.roundsPlayed,
      eloRating: playerStats.eloRating,
    })
    .from(tournamentPlayers)
    .leftJoin(playerStats, eq(playerStats.userId, tournamentPlayers.userId))
    .where(eq(tournamentPlayers.tournamentId, id));

  const players = playersRaw.map((p) => ({ ...p, eloRating: p.eloRating ?? 1000 }));

  const roundList = await db
    .select()
    .from(rounds)
    .where(eq(rounds.tournamentId, id))
    .orderBy(asc(rounds.roundNumber));

  const allMatches = await Promise.all(
    roundList.map(async (round) => {
      const roundMatches = await db
        .select()
        .from(matches)
        .where(eq(matches.roundId, round.id));
      return { ...round, matches: roundMatches };
    })
  );

  return NextResponse.json({ ...tournament, players, rounds: allMatches });
}
