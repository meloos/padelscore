import { boolean, date, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  birthdate: date("birthdate"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const tournaments = pgTable("tournaments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  type: text("type").notNull().default("mexicano"),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  status: text("status").notNull().default("active"),
  fairWaiting: boolean("fair_waiting").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const tournamentPlayers = pgTable("tournament_players", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  tournamentId: text("tournament_id")
    .notNull()
    .references(() => tournaments.id),
  userId: text("user_id").references(() => users.id),
  displayName: text("display_name").notNull(),
  totalPoints: integer("total_points").notNull().default(0),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  roundsPlayed: integer("rounds_played").notNull().default(0),
});

export const rounds = pgTable("rounds", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  tournamentId: text("tournament_id")
    .notNull()
    .references(() => tournaments.id),
  roundNumber: integer("round_number").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const matches = pgTable("matches", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  roundId: text("round_id")
    .notNull()
    .references(() => rounds.id),
  team1Player1Id: text("team1_player1_id")
    .notNull()
    .references(() => tournamentPlayers.id),
  team1Player2Id: text("team1_player2_id")
    .notNull()
    .references(() => tournamentPlayers.id),
  team2Player1Id: text("team2_player1_id")
    .notNull()
    .references(() => tournamentPlayers.id),
  team2Player2Id: text("team2_player2_id")
    .notNull()
    .references(() => tournamentPlayers.id),
  team1Score: integer("team1_score"),
  team2Score: integer("team2_score"),
  status: text("status").notNull().default("active"),
});

export const playerStats = pgTable("player_stats", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id),
  totalPoints: integer("total_points").notNull().default(0),
  totalWins: integer("total_wins").notNull().default(0),
  totalLosses: integer("total_losses").notNull().default(0),
  tournamentsPlayed: integer("tournaments_played").notNull().default(0),
  tournamentsWon: integer("tournaments_won").notNull().default(0),
  eloRating: integer("elo_rating").notNull().default(1000),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Tournament = typeof tournaments.$inferSelect;
export type TournamentPlayer = typeof tournamentPlayers.$inferSelect;
export type Round = typeof rounds.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type PlayerStats = typeof playerStats.$inferSelect;
