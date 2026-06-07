export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
    const { db } = await import("@/lib/db");
    const path = await import("path");

    migrate(db, {
      migrationsFolder: path.join(process.cwd(), "drizzle"),
    });

    console.log("[startup] Database migrations applied");
  }
}
