import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { users, playerStats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      isAdmin: users.isAdmin,
      createdAt: users.createdAt,
      totalPoints: playerStats.totalPoints,
      tournamentsPlayed: playerStats.tournamentsPlayed,
      tournamentsWon: playerStats.tournamentsWon,
    })
    .from(users)
    .leftJoin(playerStats, eq(playerStats.userId, users.id));

  return NextResponse.json(rows);
}
