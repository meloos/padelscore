import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tournaments, tournamentPlayers, rounds, matches, playerStats } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

async function fetchTournamentSnapshot(id: string) {
  const [tournament] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.id, id));

  if (!tournament) return null;

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

  const players = playersRaw.map((p) => ({ ...p, eloRating: p.eloRating ?? 1000 }));

  const roundList = await db
    .select()
    .from(rounds)
    .where(eq(rounds.tournamentId, id))
    .orderBy(asc(rounds.roundNumber));

  const roundsWithMatches = await Promise.all(
    roundList.map(async (round) => {
      const roundMatches = await db.select().from(matches).where(eq(matches.roundId, round.id));
      return { ...round, matches: roundMatches };
    })
  );

  return { ...tournament, players, rounds: roundsWithMatches };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Send initial snapshot
      const initial = await fetchTournamentSnapshot(id);
      if (!initial) {
        controller.close();
        return;
      }
      send(initial);

      const interval = setInterval(async () => {
        try {
          const snapshot = await fetchTournamentSnapshot(id);
          if (snapshot) send(snapshot);
        } catch {
          clearInterval(interval);
          controller.close();
        }
      }, 3000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
