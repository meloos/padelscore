import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tournaments, tournamentPlayers, users, rounds, matches } from "@/lib/db/schema";
import { desc, eq, or, inArray } from "drizzle-orm";
import { generateMultiCourtPairings } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const participatingIds = db
    .select({ id: tournamentPlayers.tournamentId })
    .from(tournamentPlayers)
    .where(eq(tournamentPlayers.userId, session.user.id));

  const rows = await db
    .select()
    .from(tournaments)
    .where(
      or(
        eq(tournaments.createdBy, session.user.id),
        inArray(tournaments.id, participatingIds)
      )
    )
    .orderBy(desc(tournaments.createdAt));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, type, players, fairWaiting } = await req.json();

  if (!name || !players || players.length < 4) {
    return NextResponse.json(
      { error: "Tournament needs at least 4 players" },
      { status: 400 }
    );
  }

  const [tournament] = await db
    .insert(tournaments)
    .values({
      name,
      type: type ?? "mexicano",
      createdBy: session.user.id,
      fairWaiting: fairWaiting === true,
    })
    .returning();

  const insertedPlayers = await db
    .insert(tournamentPlayers)
    .values(
      players.map((p: { displayName: string; userId?: string }) => ({
        tournamentId: tournament.id,
        userId: p.userId ?? null,
        displayName: p.displayName,
      }))
    )
    .returning();

  const playerIds = insertedPlayers.map((p) => p.id);
  const { courts } = generateMultiCourtPairings(playerIds);

  const [round] = await db
    .insert(rounds)
    .values({ tournamentId: tournament.id, roundNumber: 1 })
    .returning();

  for (const court of courts) {
    await db.insert(matches).values({
      roundId: round.id,
      team1Player1Id: court.team1[0],
      team1Player2Id: court.team1[1],
      team2Player1Id: court.team2[0],
      team2Player2Id: court.team2[1],
    });
  }

  return NextResponse.json({ ...tournament, players: insertedPlayers, round });
}
