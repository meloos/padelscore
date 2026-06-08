import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accounts, users } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Ensure the user has a password set before allowing unlink
  // (prevents locking themselves out)
  const [user] = await db.select().from(users).where(eq(users.id, session.user.id));
  if (!user?.passwordHash) {
    return NextResponse.json(
      { error: "Set a password before unlinking Facebook, otherwise you won't be able to sign in." },
      { status: 400 },
    );
  }

  await db
    .delete(accounts)
    .where(and(eq(accounts.userId, session.user.id), eq(accounts.provider, "facebook")));

  return NextResponse.json({ success: true });
}
