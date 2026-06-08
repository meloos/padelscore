import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Facebook from "next-auth/providers/facebook";
import { eq, and, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { decode } from "next-auth/jwt";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { users, accounts, playerStats, tournaments, tournamentPlayers } from "./db/schema";
import authConfig from "../auth.config";

async function getFacebookUser(
  fbId: string,
  fbEmail: string | null | undefined,
  fbName: string | null | undefined,
) {
  // 1. Already linked?
  const [existingAccount] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.provider, "facebook"), eq(accounts.providerAccountId, fbId)));

  if (existingAccount) {
    const [linked] = await db.select().from(users).where(eq(users.id, existingAccount.userId));
    return linked ?? null;
  }

  // 2. Is there a logged-in user linking from profile?
  const isSecure = process.env.NEXTAUTH_URL?.startsWith("https://") ?? false;
  const cookieName = isSecure ? "__Secure-authjs.session-token" : "authjs.session-token";
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(cookieName)?.value;

  if (sessionToken) {
    try {
      const decoded = await decode({
        token: sessionToken,
        secret: process.env.AUTH_SECRET!,
        salt: cookieName,
      }) as { id?: string } | null;

      const existingUserId = decoded?.id ?? null;

      if (existingUserId) {
        // Merge any FB-only shadow user that has the same email
        if (fbEmail) {
          const [shadow] = await db.select().from(users).where(eq(users.email, fbEmail));
          if (shadow && shadow.id !== existingUserId) {
            await mergeUsers(shadow.id, existingUserId);
          }
        }

        await db.insert(accounts).values({
          userId: existingUserId,
          provider: "facebook",
          providerAccountId: fbId,
        });

        const [dbUser] = await db.select().from(users).where(eq(users.id, existingUserId));
        return dbUser ?? null;
      }
    } catch {
      // Decode failed (expired/tampered token) — treat as no session
    }
  }

  // 3. Auto-link by email?
  if (fbEmail) {
    const [byEmail] = await db.select().from(users).where(eq(users.email, fbEmail));
    if (byEmail) {
      await db.insert(accounts).values({
        userId: byEmail.id,
        provider: "facebook",
        providerAccountId: fbId,
      });
      return byEmail;
    }
  }

  // 4. Create new user
  const [newUser] = await db
    .insert(users)
    .values({
      email: fbEmail ?? `fb_${fbId}@noemail.invalid`,
      name: fbName ?? "Facebook User",
      passwordHash: null,
      isAdmin: false,
    })
    .returning();

  await db.insert(accounts).values({
    userId: newUser.id,
    provider: "facebook",
    providerAccountId: fbId,
  });
  await db.insert(playerStats).values({ userId: newUser.id });

  return newUser;
}

async function mergeUsers(sourceId: string, targetId: string) {
  const [sourceStats] = await db.select().from(playerStats).where(eq(playerStats.userId, sourceId));

  if (sourceStats) {
    await db
      .update(playerStats)
      .set({
        totalPoints: sql`${playerStats.totalPoints} + ${sourceStats.totalPoints}`,
        totalWins: sql`${playerStats.totalWins} + ${sourceStats.totalWins}`,
        totalLosses: sql`${playerStats.totalLosses} + ${sourceStats.totalLosses}`,
        tournamentsPlayed: sql`${playerStats.tournamentsPlayed} + ${sourceStats.tournamentsPlayed}`,
        tournamentsWon: sql`${playerStats.tournamentsWon} + ${sourceStats.tournamentsWon}`,
      })
      .where(eq(playerStats.userId, targetId));

    await db.delete(playerStats).where(eq(playerStats.userId, sourceId));
  }

  await db.update(tournaments).set({ createdBy: targetId }).where(eq(tournaments.createdBy, sourceId));
  await db.update(tournamentPlayers).set({ userId: targetId }).where(eq(tournamentPlayers.userId, sourceId));
  await db.delete(users).where(eq(users.id, sourceId));
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string));

        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(credentials.password as string, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider !== "facebook") return true;

      const dbUser = await getFacebookUser(
        account.providerAccountId,
        user.email,
        user.name,
      );

      if (!dbUser) return false;

      user.id = dbUser.id;
      (user as { isAdmin?: boolean }).isAdmin = dbUser.isAdmin;
      return true;
    },
  },
  session: { strategy: "jwt" },
});
