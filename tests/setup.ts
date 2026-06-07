import { sql } from "drizzle-orm";
import { afterEach } from "vitest";
import { db } from "@/lib/db";

// Wipe all data between tests; CASCADE handles FK order automatically.
afterEach(async () => {
  await db.execute(
    sql`TRUNCATE TABLE matches, player_stats, tournament_players, rounds, tournaments, users RESTART IDENTITY CASCADE`
  );
});
