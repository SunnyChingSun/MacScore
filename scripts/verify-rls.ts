import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

async function verifyRLS() {
  console.log("🔍 Verifying RLS Status and Restaurant Access");
  console.log("==============================================\n");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !serviceKey) {
    console.error("❌ Missing Supabase credentials");
    console.error("   URL:", url ? "✅" : "❌");
    console.error("   Service Role Key:", serviceKey ? "✅" : "❌");
    process.exit(1);
  }

  console.log("1. Testing with Service Role Key (should bypass RLS):");
  console.log("   Key:", serviceKey.substring(0, 30) + "...\n");

  const supabaseService = createClient(url, serviceKey);

  // Test restaurants query
  const { data: restaurants, error: restaurantsError } = await supabaseService
    .from("restaurants")
    .select("*")
    .order("name");

  if (restaurantsError) {
    console.error("   ❌ Error querying restaurants:", restaurantsError.message);
    console.error("   Code:", restaurantsError.code);
    console.error("   Details:", restaurantsError);
  } else {
    console.log(`   ✅ Found ${restaurants?.length || 0} restaurants:`);
    if (restaurants && restaurants.length > 0) {
      restaurants.forEach((r: any) => {
        console.log(`      - ${r.name} (${r.id.substring(0, 8)}...)`);
      });
    } else {
      console.log("   ⚠️  No restaurants found!");
    }
  }

  console.log("\n2. Testing with Anon Key (respects RLS):");
  if (anonKey) {
    const supabaseAnon = createClient(url, anonKey);
    const { data: restaurantsAnon, error: anonError } = await supabaseAnon
      .from("restaurants")
      .select("*")
      .order("name");

    if (anonError) {
      console.error("   ❌ Error:", anonError.message);
      console.error("   Code:", anonError.code);
    } else {
      console.log(`   ✅ Found ${restaurantsAnon?.length || 0} restaurants with anon key`);
      if (restaurantsAnon && restaurantsAnon.length > 0) {
        restaurantsAnon.forEach((r: any) => {
          console.log(`      - ${r.name}`);
        });
      }
    }
  }

  console.log("\n3. Checking RLS Status:");
  console.log("   To check RLS status, run this in Supabase SQL Editor:");
  console.log("   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'restaurants';");
  console.log("\n   If rowsecurity = true, RLS is enabled and blocking access.");
  console.log("   If rowsecurity = false, RLS is disabled.");

  console.log("\n4. Recommendations:");
  if (restaurants && restaurants.length < 9) {
    console.log("   ⚠️  Only found", restaurants.length, "restaurant(s), but there should be 9.");
    console.log("   💡 Run this SQL in Supabase SQL Editor to disable RLS:");
    console.log("      ALTER TABLE restaurants DISABLE ROW LEVEL SECURITY;");
  } else if (restaurants && restaurants.length === 9) {
    console.log("   ✅ Found all 9 restaurants! RLS is properly configured.");
  }
}

verifyRLS().catch(console.error);

