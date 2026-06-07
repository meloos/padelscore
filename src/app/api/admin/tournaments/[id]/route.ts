import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { tournaments, rounds, matches, tournamentPlayers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const { id } = await params;
  const { name, status } = await req.json();

  const updates: Partial<typeof tournaments.$inferInsert> = {};
  if (name !== undefined) updates.name = name;
  if (status !== undefined) {
    updates.status = status;
    if (status === "completed") updates.completedAt = new Date();
    if (status === "active") updates.completedAt = null;
  }

  await db.update(tournaments).set(updates).where(eq(tournaments.id, id));

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const { id } = await params;

  const roundList = await db
    .select()
    .from(rounds)
    .where(eq(rounds.tournamentId, id));

  for (const round of roundList) {
    await db.delete(matches).where(eq(matches.roundId, round.id));
  }

  await db.delete(rounds).where(eq(rounds.tournamentId, id));
  await db.delete(tournamentPlayers).where(eq(tournamentPlayers.tournamentId, id));
  await db.delete(tournaments).where(eq(tournaments.id, id));

  return NextResponse.json({ success: true });
}
