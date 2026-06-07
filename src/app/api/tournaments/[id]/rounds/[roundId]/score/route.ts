import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  rounds,
  matches,
  tournamentPlayers,
  playerStats,
  users,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; roundId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roundId } = await params;
  const { team1Score, team2Score } = await req.json();

  if (
    typeof team1Score !== "number" ||
    typeof team2Score !== "number" ||
    team1Score + team2Score !== 21 ||
    team1Score < 0 ||
    team2Score < 0
  ) {
    return NextResponse.json(
      { error: "Scores must be non-negative integers summing to 21" },
      { status: 400 }
    );
  }

  const [round] = await db
    .select()
    .from(rounds)
    .where(eq(rounds.id, roundId));

  if (!round || round.status === "completed") {
    return NextResponse.json(
      { error: "Round not found or already completed" },
      { status: 400 }
    );
  }

  const [match] = await db
    .select()
    .from(matches)
    .where(eq(matches.roundId, roundId));

  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  await db
    .update(matches)
    .set({ team1Score, team2Score, status: "completed" })
    .where(eq(matches.id, match.id));

  await db
    .update(rounds)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(rounds.id, roundId));

  const team1Won = team1Score > team2Score;
  const team1PlayerIds = [match.team1Player1Id, match.team1Player2Id];
  const team2PlayerIds = [match.team2Player1Id, match.team2Player2Id];

  for (const playerId of team1PlayerIds) {
    const [player] = await db
      .select()
      .from(tournamentPlayers)
      .where(eq(tournamentPlayers.id, playerId));
    if (!player) continue;

    await db
      .update(tournamentPlayers)
      .set({
        totalPoints: player.totalPoints + team1Score,
        wins: player.wins + (team1Won ? 1 : 0),
        losses: player.losses + (team1Won ? 0 : 1),
        roundsPlayed: player.roundsPlayed + 1,
      })
      .where(eq(tournamentPlayers.id, playerId));

    if (player.userId) {
      await updateGlobalStats(player.userId, team1Score, team1Won);
    }
  }

  for (const playerId of team2PlayerIds) {
    const [player] = await db
      .select()
      .from(tournamentPlayers)
      .where(eq(tournamentPlayers.id, playerId));
    if (!player) continue;

    await db
      .update(tournamentPlayers)
      .set({
        totalPoints: player.totalPoints + team2Score,
        wins: player.wins + (team1Won ? 0 : 1),
        losses: player.losses + (team1Won ? 1 : 0),
        roundsPlayed: player.roundsPlayed + 1,
      })
      .where(eq(tournamentPlayers.id, playerId));

    if (player.userId) {
      await updateGlobalStats(player.userId, team2Score, !team1Won);
    }
  }

  return NextResponse.json({ success: true });
}

async function updateGlobalStats(
  userId: string,
  points: number,
  won: boolean
) {
  const [stats] = await db
    .select()
    .from(playerStats)
    .where(eq(playerStats.userId, userId));

  if (!stats) {
    await db.insert(playerStats).values({
      userId,
      totalPoints: points,
      totalWins: won ? 1 : 0,
      totalLosses: won ? 0 : 1,
      tournamentsPlayed: 0,
    });
  } else {
    await db
      .update(playerStats)
      .set({
        totalPoints: stats.totalPoints + points,
        totalWins: stats.totalWins + (won ? 1 : 0),
        totalLosses: stats.totalLosses + (won ? 0 : 1),
        updatedAt: new Date(),
      })
      .where(eq(playerStats.userId, userId));
  }
}
