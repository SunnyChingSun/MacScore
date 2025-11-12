import { config } from "dotenv";
import { resolve } from "path";
import { getSupabaseClient, getPgPool } from "@/lib/db/client";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

async function testConnection() {
  console.log("🔍 Testing Database Connection");
  console.log("==============================\n");

  const useSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const usePostgres = !!process.env.DATABASE_URL;

  if (!useSupabase && !usePostgres) {
    console.error("❌ No database configuration found in .env.local");
    console.error("   Please set up either Supabase or Postgres credentials.\n");
    process.exit(1);
  }

  if (useSupabase) {
    await testSupabase();
  } else {
    await testPostgres();
  }
}

async function testSupabase() {
  console.log("📦 Testing Supabase Connection\n");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log(`   URL: ${url?.substring(0, 40)}...`);
  console.log(`   Key: ${key ? `${key.substring(0, 20)}...` : "❌ Missing"}\n`);

  if (!url || !key) {
    console.error("❌ Missing Supabase credentials");
    process.exit(1);
  }

  try {
    const supabase = getSupabaseClient();

    console.log("1. Testing basic connection...");
    const { data, error } = await supabase.from("restaurants").select("id").limit(1);

    if (error) {
      if (error.code === "PGRST116" || error.message?.includes("relation") || error.message?.includes("does not exist")) {
        console.log("   ⚠️  Connection works, but tables don't exist yet");
        console.log("\n   📝 Next steps:");
        console.log("   1. Go to https://app.supabase.com");
        console.log("   2. Select your project");
        console.log("   3. Go to SQL Editor");
        console.log("   4. Run the migration: supabase/migrations/001_initial_schema.sql");
        console.log("   5. Then run: npm run seed\n");
        process.exit(0);
      } else if (error.message?.includes("Invalid API key") || error.status === 401) {
        console.error("   ❌ Invalid API key");
        console.error("   Please check your SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY\n");
        process.exit(1);
      } else {
        console.error(`   ❌ Error: ${error.message}`);
        console.error(`   Code: ${error.code || "N/A"}\n`);
        process.exit(1);
      }
    } else {
      console.log("   ✅ Connection successful!");
      console.log("   ✅ Tables exist and are accessible\n");
      console.log("   🎉 Your database is ready! You can run: npm run seed\n");
    }
  } catch (err: any) {
    console.error(`   ❌ Connection failed: ${err.message || err}`);
    console.error(`   Error type: ${err.constructor?.name || "Unknown"}\n`);
    
    if (err.message?.includes("fetch") || err.code === "ENOTFOUND" || err.code === "ECONNREFUSED") {
      console.error("   🔍 This is a network error. Please check:");
      console.error("   1. Your internet connection is working");
      console.error("   2. Your NEXT_PUBLIC_SUPABASE_URL is correct:");
      console.error(`      Current: ${url}`);
      console.error("      Should be: https://xxxxx.supabase.co (not .com)");
      console.error("   3. Your Supabase project is active:");
      console.error("      - Go to https://app.supabase.com");
      console.error("      - Check if your project is paused (free tier projects pause after inactivity)");
      console.error("      - If paused, click 'Restore project' to reactivate");
      console.error("   4. Try accessing the URL in your browser");
      console.error(`      ${url}/rest/v1/\n`);
    } else if (err.message?.includes("Invalid API key") || err.status === 401) {
      console.error("   🔍 Authentication error. Please check:");
      console.error("   1. Your API keys are correct");
      console.error("   2. You're using the service_role key for server-side operations");
      console.error("   3. The keys haven't been rotated\n");
    } else {
      console.error("   🔍 Unexpected error. Full details:");
      console.error(`   ${JSON.stringify(err, null, 2)}\n`);
    }
    process.exit(1);
  }
}

async function testPostgres() {
  console.log("🐘 Testing Postgres Connection\n");

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ DATABASE_URL not set\n");
    process.exit(1);
  }

  // Mask password in URL for display
  const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ":****@");
  console.log(`   Connection: ${maskedUrl}\n`);

  try {
    const pool = getPgPool();
    console.log("1. Testing connection...");
    const result = await pool.query("SELECT NOW()");
    console.log("   ✅ Connection successful!");
    console.log(`   Server time: ${result.rows[0].now}\n`);

    console.log("2. Checking if tables exist...");
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('restaurants', 'items', 'ingredients')
      ORDER BY table_name
    `);

    const existingTables = tablesResult.rows.map((r) => r.table_name);
    if (existingTables.length === 0) {
      console.log("   ⚠️  Tables don't exist yet");
      console.log("\n   📝 Next steps:");
      console.log("   1. Run the migration: psql $DATABASE_URL -f supabase/migrations/001_initial_schema.sql");
      console.log("   2. Then run: npm run seed\n");
    } else {
      console.log(`   ✅ Found ${existingTables.length} table(s): ${existingTables.join(", ")}`);
      console.log("   🎉 Your database is ready! You can run: npm run seed\n");
    }
  } catch (err: any) {
    console.error(`   ❌ Error: ${err.message}\n`);
    process.exit(1);
  }
}

testConnection();
