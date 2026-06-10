import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { rounds, matches, tournamentPlayers, playerStats } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ roundId: string }> }
) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const { roundId } = await params;
  const { team1Score, team2Score, matchId } = await req.json();

  if (
    typeof team1Score !== "number" ||
    typeof team2Score !== "number" ||
    team1Score + team2Score !== 21 ||
    team1Score < 0 ||
    team2Score < 0
  ) {
    return NextResponse.json(
      { error: "Scores must be non-negative and sum to 21" },
      { status: 400 }
    );
  }

  if (!matchId) {
    return NextResponse.json({ error: "matchId is required" }, { status: 400 });
  }

  const [round] = await db.select().from(rounds).where(eq(rounds.id, roundId));
  if (!round) return NextResponse.json({ error: "Round not found" }, { status: 404 });

  const [match] = await db.select().from(matches).where(and(eq(matches.id, matchId), eq(matches.roundId, roundId)));
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

  const wasCompleted = match.status === "completed";
  const oldT1 = match.team1Score ?? 0;
  const oldT2 = match.team2Score ?? 0;

  await db
    .update(matches)
    .set({ team1Score, team2Score, status: "completed" })
    .where(eq(matches.id, match.id));

  // Complete round only when all its matches are scored
  const allRoundMatches = await db.select().from(matches).where(eq(matches.roundId, roundId));
  const allDone = allRoundMatches.every((m) => m.id === matchId || m.status === "completed");
  if (allDone) {
    await db
      .update(rounds)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(rounds.id, roundId));
  }

  if (wasCompleted) {
    const oldT1Won = oldT1 > oldT2;
    const newT1Won = team1Score > team2Score;

    const team1Ids = [match.team1Player1Id, match.team1Player2Id];
    const team2Ids = [match.team2Player1Id, match.team2Player2Id];

    for (const pid of team1Ids) {
      const [p] = await db.select().from(tournamentPlayers).where(eq(tournamentPlayers.id, pid));
      if (!p) continue;
      await db.update(tournamentPlayers).set({
        totalPoints: p.totalPoints - oldT1 + team1Score,
        wins: p.wins - (oldT1Won ? 1 : 0) + (newT1Won ? 1 : 0),
        losses: p.losses - (oldT1Won ? 0 : 1) + (newT1Won ? 0 : 1),
      }).where(eq(tournamentPlayers.id, pid));

      if (p.userId) {
        const [s] = await db.select().from(playerStats).where(eq(playerStats.userId, p.userId));
        if (s) {
          await db.update(playerStats).set({
            totalPoints: s.totalPoints - oldT1 + team1Score,
            totalWins: s.totalWins - (oldT1Won ? 1 : 0) + (newT1Won ? 1 : 0),
            totalLosses: s.totalLosses - (oldT1Won ? 0 : 1) + (newT1Won ? 0 : 1),
            updatedAt: new Date(),
          }).where(eq(playerStats.userId, p.userId));
        }
      }
    }

    for (const pid of team2Ids) {
      const [p] = await db.select().from(tournamentPlayers).where(eq(tournamentPlayers.id, pid));
      if (!p) continue;
      await db.update(tournamentPlayers).set({
        totalPoints: p.totalPoints - oldT2 + team2Score,
        wins: p.wins - (oldT1Won ? 0 : 1) + (newT1Won ? 0 : 1),
        losses: p.losses - (oldT1Won ? 1 : 0) + (newT1Won ? 1 : 0),
      }).where(eq(tournamentPlayers.id, pid));

      if (p.userId) {
        const [s] = await db.select().from(playerStats).where(eq(playerStats.userId, p.userId));
        if (s) {
          await db.update(playerStats).set({
            totalPoints: s.totalPoints - oldT2 + team2Score,
            totalWins: s.totalWins - (oldT1Won ? 0 : 1) + (newT1Won ? 0 : 1),
            totalLosses: s.totalLosses - (oldT1Won ? 1 : 0) + (newT1Won ? 1 : 0),
            updatedAt: new Date(),
          }).where(eq(playerStats.userId, p.userId));
        }
      }
    }
  } else {
    const newT1Won = team1Score > team2Score;
    const team1Ids = [match.team1Player1Id, match.team1Player2Id];
    const team2Ids = [match.team2Player1Id, match.team2Player2Id];

    for (const pid of team1Ids) {
      const [p] = await db.select().from(tournamentPlayers).where(eq(tournamentPlayers.id, pid));
      if (!p) continue;
      await db.update(tournamentPlayers).set({
        totalPoints: p.totalPoints + team1Score,
        wins: p.wins + (newT1Won ? 1 : 0),
        losses: p.losses + (newT1Won ? 0 : 1),
        roundsPlayed: p.roundsPlayed + 1,
      }).where(eq(tournamentPlayers.id, pid));
    }

    for (const pid of team2Ids) {
      const [p] = await db.select().from(tournamentPlayers).where(eq(tournamentPlayers.id, pid));
      if (!p) continue;
      await db.update(tournamentPlayers).set({
        totalPoints: p.totalPoints + team2Score,
        wins: p.wins + (newT1Won ? 0 : 1),
        losses: p.losses + (newT1Won ? 1 : 0),
        roundsPlayed: p.roundsPlayed + 1,
      }).where(eq(tournamentPlayers.id, pid));
    }
  }

  return NextResponse.json({ success: true });
}
