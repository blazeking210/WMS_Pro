import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "@shared/schema";

const client = createClient({
  url: process.env.DATABASE_URL || "file:warehouse.db",
});

export const db = drizzle(client, { schema });

// Enable foreign keys
client.execute("PRAGMA foreign_keys = ON;").catch(console.error);