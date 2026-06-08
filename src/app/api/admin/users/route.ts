import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
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

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const { name, email } = await req.json();

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email.trim()));
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const tempPassword = randomBytes(10).toString("base64url").slice(0, 12);
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const [user] = await db
    .insert(users)
    .values({ name: name.trim(), email: email.trim().toLowerCase(), passwordHash })
    .returning();

  await db.insert(playerStats).values({ userId: user.id });

  return NextResponse.json({ id: user.id, name: user.name, email: user.email, tempPassword });
}
