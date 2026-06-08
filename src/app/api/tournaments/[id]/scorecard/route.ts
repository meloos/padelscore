import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tournaments, tournamentPlayers, rounds, matches, playerStats } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { renderToBuffer, Document } from "@react-pdf/renderer";
import { createElement, ReactElement } from "react";
import type { DocumentProps } from "@react-pdf/renderer";
import { ScorecardDocument } from "@/components/pdf/scorecard-document";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  const [tournament] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.id, id));

  if (!tournament) {
    return new Response("Not found", { status: 404 });
  }

  const playersRaw = await db
    .select({
      id: tournamentPlayers.id,
      userId: tournamentPlayers.userId,
      displayName: tournamentPlayers.displayName,
      totalPoints: tournamentPlayers.totalPoints,
      wins: tournamentPlayers.wins,
      losses: tournamentPlayers.losses,
      roundsPlayed: tournamentPlayers.roundsPlayed,
      eloRating: playerStats.eloRating,
    })
    .from(tournamentPlayers)
    .leftJoin(playerStats, eq(playerStats.userId, tournamentPlayers.userId))
    .where(eq(tournamentPlayers.tournamentId, id));

  const players = playersRaw.map((p) => ({ ...p, eloRating: p.eloRating ?? undefined }));

  const roundList = await db
    .select()
    .from(rounds)
    .where(eq(rounds.tournamentId, id))
    .orderBy(asc(rounds.roundNumber));

  const roundsWithMatches = await Promise.all(
    roundList.map(async (round) => {
      const [m] = await db.select().from(matches).where(eq(matches.roundId, round.id));
      return { ...round, match: m };
    })
  );

  const data = { ...tournament, players, rounds: roundsWithMatches };

  const buffer = await renderToBuffer(
    createElement(ScorecardDocument, { tournament: data }) as ReactElement<DocumentProps>
  );

  const safeName = tournament.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}_scorecard.pdf"`,
    },
  });
}
