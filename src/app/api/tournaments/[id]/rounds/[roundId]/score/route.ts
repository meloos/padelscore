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
import { calculateTeamElo } from "@/lib/elo";

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

  // Fetch all four tournament players and their global stats for ELO calculation
  const allIds = [...team1PlayerIds, ...team2PlayerIds];
  const allPlayers = await Promise.all(
    allIds.map((pid) =>
      db.select().from(tournamentPlayers).where(eq(tournamentPlayers.id, pid)).then((r) => r[0])
    )
  );
  const [tp1p1, tp1p2, tp2p1, tp2p2] = allPlayers;

  const getElo = async (userId: string | null) => {
    if (!userId) return 1000;
    const [s] = await db.select({ eloRating: playerStats.eloRating }).from(playerStats).where(eq(playerStats.userId, userId));
    return s?.eloRating ?? 1000;
  };

  const [elo1p1, elo1p2, elo2p1, elo2p2] = await Promise.all([
    getElo(tp1p1?.userId ?? null),
    getElo(tp1p2?.userId ?? null),
    getElo(tp2p1?.userId ?? null),
    getElo(tp2p2?.userId ?? null),
  ]);

  const newElos = calculateTeamElo(
    [elo1p1, elo1p2],
    [elo2p1, elo2p2],
    team1Won
  );

  const eloByTpId: Record<string, number> = {
    [match.team1Player1Id]: newElos.team1[0],
    [match.team1Player2Id]: newElos.team1[1],
    [match.team2Player1Id]: newElos.team2[0],
    [match.team2Player2Id]: newElos.team2[1],
  };

  for (const player of allPlayers) {
    if (!player) continue;
    const isTeam1 = team1PlayerIds.includes(player.id);
    const playerScore = isTeam1 ? team1Score : team2Score;
    const won = isTeam1 ? team1Won : !team1Won;

    await db
      .update(tournamentPlayers)
      .set({
        totalPoints: player.totalPoints + playerScore,
        wins: player.wins + (won ? 1 : 0),
        losses: player.losses + (won ? 0 : 1),
        roundsPlayed: player.roundsPlayed + 1,
      })
      .where(eq(tournamentPlayers.id, player.id));

    if (player.userId) {
      await updateGlobalStats(player.userId, playerScore, won, eloByTpId[player.id]);
    }
  }

  return NextResponse.json({ success: true });
}

async function updateGlobalStats(
  userId: string,
  points: number,
  won: boolean,
  newElo: number
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
      eloRating: newElo,
    });
  } else {
    await db
      .update(playerStats)
      .set({
        totalPoints: stats.totalPoints + points,
        totalWins: stats.totalWins + (won ? 1 : 0),
        totalLosses: stats.totalLosses + (won ? 0 : 1),
        eloRating: newElo,
        updatedAt: new Date(),
      })
      .where(eq(playerStats.userId, userId));
  }
}
