import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { playerStats, users } from "@/lib/db/schema";
import { createUser } from "../helpers";

describe("users table", () => {
  it("inserts and retrieves a user", async () => {
    const user = await createUser({ email: "alice@example.com", name: "Alice" });

    expect(user.id).toBeTruthy();
    expect(user.email).toBe("alice@example.com");
    expect(user.name).toBe("Alice");
    expect(user.isAdmin).toBe(false);
    expect(user.createdAt).toBeInstanceOf(Date);
  });

  it("enforces unique email constraint", async () => {
    await createUser({ email: "dup@example.com" });

    await expect(createUser({ email: "dup@example.com" })).rejects.toThrow();
  });

  it("defaults isAdmin to false", async () => {
    const user = await createUser();
    expect(user.isAdmin).toBe(false);
  });

  it("can create an admin user", async () => {
    const admin = await createUser({ email: "admin@example.com", isAdmin: true });
    expect(admin.isAdmin).toBe(true);
  });

  it("deletes a user", async () => {
    const user = await createUser();
    await db.delete(users).where(eq(users.id, user.id));

    const found = await db.select().from(users).where(eq(users.id, user.id));
    expect(found).toHaveLength(0);
  });
});

describe("player_stats table", () => {
  it("can insert player stats linked to a user", async () => {
    const user = await createUser();

    const [stats] = await db
      .insert(playerStats)
      .values({ userId: user.id })
      .returning();

    expect(stats.userId).toBe(user.id);
    expect(stats.totalPoints).toBe(0);
    expect(stats.totalWins).toBe(0);
    expect(stats.totalLosses).toBe(0);
    expect(stats.tournamentsPlayed).toBe(0);
    expect(stats.tournamentsWon).toBe(0);
  });

  it("enforces one stats row per user", async () => {
    const user = await createUser();
    await db.insert(playerStats).values({ userId: user.id });

    await expect(
      db.insert(playerStats).values({ userId: user.id })
    ).rejects.toThrow();
  });
});
