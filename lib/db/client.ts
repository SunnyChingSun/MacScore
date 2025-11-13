import { createClient } from "@supabase/supabase-js";
import { Pool } from "pg";

// Supabase client (if using Supabase)
let supabaseClient: ReturnType<typeof createClient> | null = null;

// Postgres pool (if using direct Postgres)
let pgPool: Pool | null = null;

export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // In API routes (server-side), prefer service role key to bypass RLS
  // In browser (client-side), use anon key
  // Check if we're in a server context (API route or server component)
  const isServer = typeof window === "undefined";
  const key = isServer
    ? (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // In development, provide helpful error message and return empty results gracefully
    if (process.env.NODE_ENV === "development") {
      console.warn("Missing Supabase environment variables. Database queries will return empty results.");
    }
    // Return a mock client that won't cause errors but will return empty results
    // This prevents 500 errors when the database is not configured
    return createClient(url || "https://placeholder.supabase.co", key || "placeholder-key", {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  // On server, always create a new client with service role key to ensure RLS bypass
  // On client, cache the client to avoid recreating it
  if (isServer) {
    // Server-side: Always use service role key if available, don't cache
    // This ensures API routes bypass RLS
    const serverKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!serverKey) {
      // In development, provide helpful error message and return a mock client
      if (process.env.NODE_ENV === "development") {
        console.warn("Missing Supabase service role key or anon key for server-side requests. Using fallback mode.");
        return createClient(url || "https://placeholder.supabase.co", "placeholder-key", {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        });
      }
      throw new Error("Missing Supabase service role key or anon key for server-side requests");
    }
    return createClient(url, serverKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          "apikey": serverKey,
        },
      },
    });
  }

  // Client-side: Cache the client
  if (!supabaseClient) {
    supabaseClient = createClient(url, key);
  }

  return supabaseClient;
}

export function getPgPool() {
  if (!pgPool) {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      // In development, provide helpful error message and return a mock pool
      if (process.env.NODE_ENV === "development") {
        console.warn("Missing DATABASE_URL environment variable. Database queries will return empty results.");
        // Return a mock pool that won't cause errors but will fail queries gracefully
        // This is handled in queryPg function which returns empty arrays on error
        throw new Error("Missing DATABASE_URL environment variable");
      }
      throw new Error("Missing DATABASE_URL environment variable");
    }

    pgPool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      // Add connection timeout to prevent hanging
      connectionTimeoutMillis: 5000,
    });

    // Handle pool errors gracefully
    pgPool.on("error", (err) => {
      console.error("Unexpected error on idle client", err);
      // Don't throw - let the application continue
    });
  }

  return pgPool;
}

// Use Supabase if available, otherwise fall back to Postgres
export function getDbClient() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return getSupabaseClient();
  } else if (process.env.DATABASE_URL) {
    return getPgPool();
  } else {
    throw new Error("No database configuration found. Please set either Supabase or DATABASE_URL.");
  }
}
