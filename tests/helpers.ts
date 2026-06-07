import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { matches, rounds, tournamentPlayers, tournaments, users } from "@/lib/db/schema";

export async function createUser(overrides: Partial<typeof users.$inferInsert> = {}) {
  const [user] = await db
    .insert(users)
    .values({
      email: "test@example.com",
      name: "Test User",
      passwordHash: await bcrypt.hash("password123", 10),
      isAdmin: false,
      ...overrides,
    })
    .returning();
  return user;
}

export async function createTournament(
  createdBy: string,
  overrides: Partial<typeof tournaments.$inferInsert> = {}
) {
  const [tournament] = await db
    .insert(tournaments)
    .values({
      name: "Test Tournament",
      type: "mexicano",
      createdBy,
      status: "active",
      ...overrides,
    })
    .returning();
  return tournament;
}

export async function createTournamentPlayer(
  tournamentId: string,
  overrides: Partial<typeof tournamentPlayers.$inferInsert> = {}
) {
  const [player] = await db
    .insert(tournamentPlayers)
    .values({
      tournamentId,
      displayName: "Player",
      ...overrides,
    })
    .returning();
  return player;
}

export async function createRound(tournamentId: string, roundNumber = 1) {
  const [round] = await db
    .insert(rounds)
    .values({ tournamentId, roundNumber, status: "active" })
    .returning();
  return round;
}

export async function createMatch(
  roundId: string,
  playerIds: [string, string, string, string]
) {
  const [match] = await db
    .insert(matches)
    .values({
      roundId,
      team1Player1Id: playerIds[0],
      team1Player2Id: playerIds[1],
      team2Player1Id: playerIds[2],
      team2Player2Id: playerIds[3],
      status: "active",
    })
    .returning();
  return match;
}
