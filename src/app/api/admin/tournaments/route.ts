import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { tournaments, users } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const rows = await db
    .select({
      id: tournaments.id,
      name: tournaments.name,
      type: tournaments.type,
      status: tournaments.status,
      createdAt: tournaments.createdAt,
      completedAt: tournaments.completedAt,
      createdBy: tournaments.createdBy,
      ownerName: users.name,
      ownerEmail: users.email,
    })
    .from(tournaments)
    .leftJoin(users, eq(users.id, tournaments.createdBy))
    .orderBy(desc(tournaments.createdAt));

  return NextResponse.json(rows);
}
