import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  tournaments,
  tournamentPlayers,
  playerStats,
  rounds,
} from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const lastRound = await db
    .select()
    .from(rounds)
    .where(eq(rounds.tournamentId, id))
    .orderBy(desc(rounds.roundNumber))
    .get();

  if (lastRound?.status === "active") {
    return NextResponse.json(
      { error: "Cannot complete tournament while a round is still active" },
      { status: 400 }
    );
  }

  await db
    .update(tournaments)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(tournaments.id, id));

  const players = await db
    .select()
    .from(tournamentPlayers)
    .where(eq(tournamentPlayers.tournamentId, id))
    .orderBy(desc(tournamentPlayers.totalPoints));

  const winner = players[0];

  for (const player of players) {
    if (!player.userId) continue;

    const stats = await db
      .select()
      .from(playerStats)
      .where(eq(playerStats.userId, player.userId))
      .get();

    if (stats) {
      await db
        .update(playerStats)
        .set({
          tournamentsPlayed: stats.tournamentsPlayed + 1,
          tournamentsWon:
            stats.tournamentsWon + (player.id === winner.id ? 1 : 0),
          updatedAt: new Date(),
        })
        .where(eq(playerStats.userId, player.userId));
    }
  }

  return NextResponse.json({ success: true, winner: winner.displayName });
}
