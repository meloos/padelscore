import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, playerStats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      totalPoints: playerStats.totalPoints,
      totalWins: playerStats.totalWins,
      totalLosses: playerStats.totalLosses,
      tournamentsPlayed: playerStats.tournamentsPlayed,
      tournamentsWon: playerStats.tournamentsWon,
    })
    .from(users)
    .leftJoin(playerStats, eq(playerStats.userId, users.id))
    .orderBy(playerStats.totalPoints);

  return NextResponse.json(rows);
}
