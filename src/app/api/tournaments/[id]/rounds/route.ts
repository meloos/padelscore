import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tournaments, tournamentPlayers, rounds, matches } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { generatePairings } from "@/lib/utils";

export async function POST(
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

  if (!tournament || tournament.status === "completed") {
    return NextResponse.json(
      { error: "Tournament not found or already completed" },
      { status: 400 }
    );
  }

  const [lastRound] = await db
    .select()
    .from(rounds)
    .where(eq(rounds.tournamentId, id))
    .orderBy(desc(rounds.roundNumber));

  if (lastRound?.status === "active") {
    return NextResponse.json(
      { error: "Current round not yet completed" },
      { status: 400 }
    );
  }

  const nextNumber = (lastRound?.roundNumber ?? 0) + 1;

  const players = await db
    .select()
    .from(tournamentPlayers)
    .where(eq(tournamentPlayers.tournamentId, id));

  const playerIds = players.map((p) => p.id);
  const [team1, team2] = generatePairings(playerIds);

  const [round] = await db
    .insert(rounds)
    .values({ tournamentId: id, roundNumber: nextNumber })
    .returning();

  const [match] = await db
    .insert(matches)
    .values({
      roundId: round.id,
      team1Player1Id: team1[0],
      team1Player2Id: team1[1],
      team2Player1Id: team2[0],
      team2Player2Id: team2[1],
    })
    .returning();

  return NextResponse.json({ ...round, match });
}
