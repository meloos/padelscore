import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "path";

const DATABASE_URL = process.env.DATABASE_URL ?? "./local.db";

const sqlite = new Database(DATABASE_URL);
const db = drizzle(sqlite);

migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });

console.log("Migration complete");
sqlite.close();
