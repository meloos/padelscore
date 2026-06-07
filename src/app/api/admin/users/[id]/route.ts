import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const { id } = await params;
  const { isAdmin, name, birthdate, generatePassword } = await req.json();

  const updates: Partial<typeof users.$inferInsert> = {};
  if (isAdmin !== undefined) updates.isAdmin = isAdmin;
  if (name !== undefined) updates.name = name;
  if (birthdate !== undefined) updates.birthdate = birthdate || null;

  let generatedPassword: string | undefined;
  if (generatePassword) {
    generatedPassword = randomBytes(10).toString("base64url").slice(0, 12);
    updates.passwordHash = await bcrypt.hash(generatedPassword, 12);
  }

  if (Object.keys(updates).length > 0) {
    await db.update(users).set(updates).where(eq(users.id, id));
  }

  return NextResponse.json({ success: true, generatedPassword });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const { id } = await params;

  const session = await (await import("@/lib/auth")).auth();
  if (session?.user?.id === id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  await db.delete(users).where(eq(users.id, id));

  return NextResponse.json({ success: true });
}
