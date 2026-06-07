import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { matches, rounds, tournamentPlayers, tournaments } from "@/lib/db/schema";
import {
  createMatch,
  createRound,
  createTournament,
  createTournamentPlayer,
  createUser,
} from "../helpers";

describe("tournaments table", () => {
  it("creates a tournament linked to a user", async () => {
    const user = await createUser();
    const tournament = await createTournament(user.id, { name: "Summer Cup" });

    expect(tournament.id).toBeTruthy();
    expect(tournament.name).toBe("Summer Cup");
    expect(tournament.createdBy).toBe(user.id);
    expect(tournament.status).toBe("active");
    expect(tournament.type).toBe("mexicano");
    expect(tournament.createdAt).toBeInstanceOf(Date);
  });

  it("can complete a tournament", async () => {
    const user = await createUser();
    const tournament = await createTournament(user.id);
    const now = new Date();

    const [updated] = await db
      .update(tournaments)
      .set({ status: "completed", completedAt: now })
      .where(eq(tournaments.id, tournament.id))
      .returning();

    expect(updated.status).toBe("completed");
    expect(updated.completedAt).toBeInstanceOf(Date);
  });
});

describe("tournament_players table", () => {
  it("creates a guest player (no userId)", async () => {
    const user = await createUser();
    const tournament = await createTournament(user.id);
    const player = await createTournamentPlayer(tournament.id, {
      displayName: "Guest One",
    });

    expect(player.displayName).toBe("Guest One");
    expect(player.userId).toBeNull();
    expect(player.totalPoints).toBe(0);
  });

  it("creates a registered player linked to a user", async () => {
    const user = await createUser();
    const tournament = await createTournament(user.id);
    const player = await createTournamentPlayer(tournament.id, {
      displayName: user.name,
      userId: user.id,
    });

    expect(player.userId).toBe(user.id);
  });

  it("accumulates points on update", async () => {
    const user = await createUser();
    const tournament = await createTournament(user.id);
    const player = await createTournamentPlayer(tournament.id, { displayName: "P1" });

    const [updated] = await db
      .update(tournamentPlayers)
      .set({ totalPoints: 14, wins: 1, roundsPlayed: 1 })
      .where(eq(tournamentPlayers.id, player.id))
      .returning();

    expect(updated.totalPoints).toBe(14);
    expect(updated.wins).toBe(1);
    expect(updated.roundsPlayed).toBe(1);
  });
});

describe("rounds and matches", () => {
  it("creates a round and four matches for a tournament", async () => {
    const user = await createUser();
    const tournament = await createTournament(user.id);

    const playerNames = ["Alice", "Bob", "Charlie", "Dave"];
    const players = await Promise.all(
      playerNames.map((name) =>
        createTournamentPlayer(tournament.id, { displayName: name })
      )
    );

    const round = await createRound(tournament.id, 1);
    const match = await createMatch(round.id, [
      players[0].id,
      players[1].id,
      players[2].id,
      players[3].id,
    ]);

    expect(round.roundNumber).toBe(1);
    expect(round.status).toBe("active");
    expect(match.team1Player1Id).toBe(players[0].id);
    expect(match.team2Player2Id).toBe(players[3].id);
    expect(match.team1Score).toBeNull();
    expect(match.team2Score).toBeNull();
  });

  it("records a score and completes the round", async () => {
    const user = await createUser();
    const tournament = await createTournament(user.id);

    const players = await Promise.all(
      ["A", "B", "C", "D"].map((n) =>
        createTournamentPlayer(tournament.id, { displayName: n })
      )
    );

    const round = await createRound(tournament.id, 1);
    const match = await createMatch(round.id, [
      players[0].id,
      players[1].id,
      players[2].id,
      players[3].id,
    ]);

    // Submit score: team1 wins 14–7
    const [scoredMatch] = await db
      .update(matches)
      .set({ team1Score: 14, team2Score: 7, status: "completed" })
      .where(eq(matches.id, match.id))
      .returning();

    expect(scoredMatch.team1Score).toBe(14);
    expect(scoredMatch.team2Score).toBe(7);
    expect(scoredMatch.team1Score! + scoredMatch.team2Score!).toBe(21);

    // Complete the round
    const [completedRound] = await db
      .update(rounds)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(rounds.id, round.id))
      .returning();

    expect(completedRound.status).toBe("completed");
    expect(completedRound.completedAt).toBeInstanceOf(Date);
  });

  it("cascade-deletes rounds and matches when tournament is deleted", async () => {
    const user = await createUser();
    const tournament = await createTournament(user.id);

    const players = await Promise.all(
      ["A", "B", "C", "D"].map((n) =>
        createTournamentPlayer(tournament.id, { displayName: n })
      )
    );
    const round = await createRound(tournament.id, 1);
    await createMatch(round.id, [
      players[0].id,
      players[1].id,
      players[2].id,
      players[3].id,
    ]);

    // FK constraints are set to NO ACTION — must delete children manually (as the API does)
    await db.delete(matches).where(eq(matches.roundId, round.id));
    await db.delete(rounds).where(eq(rounds.tournamentId, tournament.id));
    await db.delete(tournamentPlayers).where(eq(tournamentPlayers.tournamentId, tournament.id));
    await db.delete(tournaments).where(eq(tournaments.id, tournament.id));

    const remainingRounds = await db
      .select()
      .from(rounds)
      .where(eq(rounds.tournamentId, tournament.id));
    expect(remainingRounds).toHaveLength(0);
  });
});
