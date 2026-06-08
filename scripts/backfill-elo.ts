/**
 * One-time ELO backfill: replays all completed matches in chronological order
 * and updates player_stats.elo_rating for every registered player.
 *
 * Run on the production server:
 *   DATABASE_URL=<prod-url> npx tsx scripts/backfill-elo.ts
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, asc } from "drizzle-orm";
import {
  matches,
  rounds,
  tournaments,
  tournamentPlayers,
  playerStats,
} from "../src/lib/db/schema";
import { calculateTeamElo } from "../src/lib/elo";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function main() {
  console.log("Fetching completed matches in chronological order…");

  // Fetch all completed matches ordered by tournament creation time, then round number
  const rows = await db
    .select({
      matchId: matches.id,
      team1Player1Id: matches.team1Player1Id,
      team1Player2Id: matches.team1Player2Id,
      team2Player1Id: matches.team2Player1Id,
      team2Player2Id: matches.team2Player2Id,
      team1Score: matches.team1Score,
      team2Score: matches.team2Score,
      roundNumber: rounds.roundNumber,
      tournamentCreatedAt: tournaments.createdAt,
    })
    .from(matches)
    .innerJoin(rounds, eq(rounds.id, matches.roundId))
    .innerJoin(tournaments, eq(tournaments.id, rounds.tournamentId))
    .where(eq(matches.status, "completed"))
    .orderBy(asc(tournaments.createdAt), asc(rounds.roundNumber));

  console.log(`Found ${rows.length} completed matches.`);

  // Resolve tournament player IDs → user IDs
  const allTpIds = new Set(
    rows.flatMap((r) => [
      r.team1Player1Id,
      r.team1Player2Id,
      r.team2Player1Id,
      r.team2Player2Id,
    ])
  );

  const allTpList = await db
    .select({ id: tournamentPlayers.id, userId: tournamentPlayers.userId })
    .from(tournamentPlayers);

  const tpMap = new Map(
    allTpList.filter((tp) => allTpIds.has(tp.id)).map((tp) => [tp.id, tp.userId])
  );

  // ELO state: userId → current rating (start everyone at 1000)
  const eloMap = new Map<string, number>();

  const getElo = (userId: string | null | undefined) =>
    userId ? (eloMap.get(userId) ?? 1000) : 1000;

  let processed = 0;

  for (const row of rows) {
    const u1p1 = tpMap.get(row.team1Player1Id);
    const u1p2 = tpMap.get(row.team1Player2Id);
    const u2p1 = tpMap.get(row.team2Player1Id);
    const u2p2 = tpMap.get(row.team2Player2Id);

    const team1Won = (row.team1Score ?? 0) > (row.team2Score ?? 0);

    const newElos = calculateTeamElo(
      [getElo(u1p1), getElo(u1p2)],
      [getElo(u2p1), getElo(u2p2)],
      team1Won
    );

    if (u1p1) eloMap.set(u1p1, newElos.team1[0]);
    if (u1p2) eloMap.set(u1p2, newElos.team1[1]);
    if (u2p1) eloMap.set(u2p1, newElos.team2[0]);
    if (u2p2) eloMap.set(u2p2, newElos.team2[1]);

    processed++;
  }

  console.log(`Processed ${processed} matches. Writing ELO ratings…`);

  // Update player_stats for every affected registered player
  let updated = 0;
  for (const [userId, elo] of Array.from(eloMap)) {
    const [existing] = await db
      .select({ id: playerStats.id })
      .from(playerStats)
      .where(eq(playerStats.userId, userId));

    if (existing) {
      await db
        .update(playerStats)
        .set({ eloRating: elo, updatedAt: new Date() })
        .where(eq(playerStats.userId, userId));
      updated++;
    }
  }

  console.log(`Updated ELO for ${updated} players:`);
  for (const [userId, elo] of Array.from(eloMap.entries()).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${userId}: ${elo}`);
  }

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  pool.end();
  process.exit(1);
});
