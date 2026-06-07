import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tournaments, tournamentPlayers, rounds, matches } from "@/lib/db/schema";
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

  const tournament = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.id, id))
    .get();

  if (!tournament) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const players = await db
    .select()
    .from(tournamentPlayers)
    .where(eq(tournamentPlayers.tournamentId, id));

  const roundList = await db
    .select()
    .from(rounds)
    .where(eq(rounds.tournamentId, id))
    .orderBy(asc(rounds.roundNumber));

  const matchList = await db
    .select()
    .from(matches)
    .where(
      eq(
        matches.roundId,
        db
          .select({ id: rounds.id })
          .from(rounds)
          .where(eq(rounds.tournamentId, id))
          .limit(1)
          .offset(0)
      )
    );

  const allMatches = await Promise.all(
    roundList.map(async (round) => {
      const m = await db
        .select()
        .from(matches)
        .where(eq(matches.roundId, round.id))
        .get();
      return { ...round, match: m };
    })
  );

  return NextResponse.json({ ...tournament, players, rounds: allMatches });
}
