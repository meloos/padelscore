import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import {
  tournamentPlayers,
  playerStats,
  tournaments,
} from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

/** Recomputes and writes playerStats for a given userId from their tournament records. */
async function recomputeStats(userId: string) {
  const tps = await db
    .select()
    .from(tournamentPlayers)
    .where(eq(tournamentPlayers.userId, userId));

  const totalPoints = tps.reduce((s, tp) => s + tp.totalPoints, 0);
  const totalWins = tps.reduce((s, tp) => s + tp.wins, 0);
  const totalLosses = tps.reduce((s, tp) => s + tp.losses, 0);

  let tournamentsPlayed = 0;
  let tournamentsWon = 0;

  for (const tp of tps) {
    const [t] = await db
      .select({ status: tournaments.status })
      .from(tournaments)
      .where(eq(tournaments.id, tp.tournamentId));

    if (!t || t.status !== "completed") continue;
    tournamentsPlayed++;

    // Winner is the player with the most points (ties broken by wins)
    const [top] = await db
      .select({ id: tournamentPlayers.id })
      .from(tournamentPlayers)
      .where(eq(tournamentPlayers.tournamentId, tp.tournamentId))
      .orderBy(desc(tournamentPlayers.totalPoints), desc(tournamentPlayers.wins));

    if (top?.id === tp.id) tournamentsWon++;
  }

  const [existing] = await db
    .select({ id: playerStats.id })
    .from(playerStats)
    .where(eq(playerStats.userId, userId));

  if (existing) {
    await db
      .update(playerStats)
      .set({ totalPoints, totalWins, totalLosses, tournamentsPlayed, tournamentsWon, updatedAt: new Date() })
      .where(eq(playerStats.userId, userId));
  } else {
    await db.insert(playerStats).values({
      userId,
      totalPoints,
      totalWins,
      totalLosses,
      tournamentsPlayed,
      tournamentsWon,
    });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const { id } = await params;
  const { userId, displayName } = await req.json();

  const [tp] = await db
    .select()
    .from(tournamentPlayers)
    .where(eq(tournamentPlayers.id, id));

  if (!tp) {
    return NextResponse.json({ error: "Tournament player not found" }, { status: 404 });
  }

  const oldUserId = tp.userId;
  const newUserId: string | null = userId ?? null;

  const updates: Partial<typeof tournamentPlayers.$inferInsert> = {
    userId: newUserId,
  };
  if (displayName !== undefined) updates.displayName = displayName.trim();

  await db.update(tournamentPlayers).set(updates).where(eq(tournamentPlayers.id, id));

  // Recompute stats for both affected users
  if (oldUserId) await recomputeStats(oldUserId);
  if (newUserId && newUserId !== oldUserId) await recomputeStats(newUserId);

  return NextResponse.json({ success: true });
}
