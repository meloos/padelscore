import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users, playerStats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (existing) {
    return NextResponse.json(
      { error: "Email already registered" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const isAdmin = process.env.ADMIN_EMAIL === email;

  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash, isAdmin })
    .returning();

  await db.insert(playerStats).values({ userId: user.id });

  return NextResponse.json({ id: user.id, name: user.name, email: user.email });
}
