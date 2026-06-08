import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  users,
  playerStats,
  tournamentPlayers,
  matches,
  rounds,
  tournaments,
} from "@/lib/db/schema";
import { eq, or, and } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, id));

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [stats] = await db
    .select()
    .from(playerStats)
    .where(eq(playerStats.userId, id));

  // Get all tournament player records for this user
  const tpRows = await db
    .select()
    .from(tournamentPlayers)
    .where(eq(tournamentPlayers.userId, id));

  const tpIds = tpRows.map((tp) => tp.id);

  if (tpIds.length === 0) {
    return NextResponse.json({
      ...user,
      stats: stats ?? null,
      matchHistory: [],
      headToHead: [],
    });
  }

  // Fetch all completed matches involving any of this user's tournament player records
  const allMatches = await db
    .select({
      matchId: matches.id,
      roundId: matches.roundId,
      team1Player1Id: matches.team1Player1Id,
      team1Player2Id: matches.team1Player2Id,
      team2Player1Id: matches.team2Player1Id,
      team2Player2Id: matches.team2Player2Id,
      team1Score: matches.team1Score,
      team2Score: matches.team2Score,
      roundNumber: rounds.roundNumber,
      tournamentId: rounds.tournamentId,
      tournamentName: tournaments.name,
    })
    .from(matches)
    .innerJoin(rounds, eq(rounds.id, matches.roundId))
    .innerJoin(tournaments, eq(tournaments.id, rounds.tournamentId))
    .where(
      and(
        eq(matches.status, "completed"),
        or(
          ...tpIds.flatMap((tpId) => [
            eq(matches.team1Player1Id, tpId),
            eq(matches.team1Player2Id, tpId),
            eq(matches.team2Player1Id, tpId),
            eq(matches.team2Player2Id, tpId),
          ])
        )
      )
    );

  // Gather all unique tp IDs from these matches to resolve display names
  const involvedTpIds = new Set<string>();
  for (const m of allMatches) {
    involvedTpIds.add(m.team1Player1Id);
    involvedTpIds.add(m.team1Player2Id);
    involvedTpIds.add(m.team2Player1Id);
    involvedTpIds.add(m.team2Player2Id);
  }

  const tpDetails = await db
    .select({ id: tournamentPlayers.id, displayName: tournamentPlayers.displayName, userId: tournamentPlayers.userId })
    .from(tournamentPlayers)
    .where(
      or(...Array.from(involvedTpIds).map((tid) => eq(tournamentPlayers.id, tid)))
    );

  const tpMap = Object.fromEntries(tpDetails.map((tp) => [tp.id, tp]));
  const myTpIdSet = new Set(tpIds);

  // H2H accumulator: keyed by opponent userId (registered) or displayName (guest)
  const h2hMap = new Map<string, { name: string; userId: string | null; wins: number; losses: number }>();

  const matchHistory = allMatches.map((m) => {
    const myTp = [m.team1Player1Id, m.team1Player2Id, m.team2Player1Id, m.team2Player2Id].find(
      (pid) => myTpIdSet.has(pid)
    )!;
    const onTeam1 = m.team1Player1Id === myTp || m.team1Player2Id === myTp;

    const partnerTpId = onTeam1
      ? m.team1Player1Id === myTp ? m.team1Player2Id : m.team1Player1Id
      : m.team2Player1Id === myTp ? m.team2Player2Id : m.team2Player1Id;

    const opponentTpIds = onTeam1
      ? [m.team2Player1Id, m.team2Player2Id]
      : [m.team1Player1Id, m.team1Player2Id];

    const myScore = onTeam1 ? m.team1Score! : m.team2Score!;
    const oppScore = onTeam1 ? m.team2Score! : m.team1Score!;
    const won = myScore > oppScore;

    // Update H2H for each opponent
    for (const oppId of opponentTpIds) {
      const opp = tpMap[oppId];
      if (!opp) continue;
      const key = opp.userId ?? opp.displayName;
      const existing = h2hMap.get(key) ?? { name: opp.displayName, userId: opp.userId ?? null, wins: 0, losses: 0 };
      h2hMap.set(key, {
        ...existing,
        wins: existing.wins + (won ? 1 : 0),
        losses: existing.losses + (won ? 0 : 1),
      });
    }

    return {
      matchId: m.matchId,
      tournamentId: m.tournamentId,
      tournamentName: m.tournamentName,
      roundNumber: m.roundNumber,
      partner: tpMap[partnerTpId]?.displayName ?? "?",
      partnerUserId: tpMap[partnerTpId]?.userId ?? null,
      opponents: opponentTpIds.map((oid) => ({
        name: tpMap[oid]?.displayName ?? "?",
        userId: tpMap[oid]?.userId ?? null,
      })),
      myScore,
      oppScore,
      won,
    };
  });

  // Sort most recent first — use roundNumber desc, tournamentName as secondary
  matchHistory.sort((a, b) => b.roundNumber - a.roundNumber);

  const headToHead = Array.from(h2hMap.values()).sort(
    (a, b) => b.wins + b.losses - (a.wins + a.losses)
  );

  return NextResponse.json({
    ...user,
    stats: stats ?? null,
    matchHistory,
    headToHead,
  });
}
