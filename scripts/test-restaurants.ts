import { config } from "dotenv";
import { resolve } from "path";
import { getSupabaseClient } from "@/lib/db/client";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

async function testRestaurants() {
  console.log("🔍 Testing Restaurant Query");
  console.log("===========================\n");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log(`URL: ${url?.substring(0, 40)}...`);
  console.log(`Service Role Key: ${serviceKey ? `${serviceKey.substring(0, 20)}...` : "❌ Not set"}`);
  console.log(`Anon Key: ${anonKey ? `${anonKey.substring(0, 20)}...` : "❌ Not set"}\n`);

  try {
    // Test with service role key
    if (serviceKey) {
      console.log("1. Testing with Service Role Key (should bypass RLS):");
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseService = createClient(url!, serviceKey);
      
      const { data: restaurants, error: serviceError } = await supabaseService
        .from("restaurants")
        .select("*")
        .order("name");

      if (serviceError) {
        console.error(`   ❌ Error: ${serviceError.message}`);
        console.error(`   Code: ${serviceError.code}`);
      } else {
        console.log(`   ✅ Found ${restaurants?.length || 0} restaurants:`);
        restaurants?.forEach((r: any) => {
          console.log(`      - ${r.name} (${r.id})`);
        });
      }
      console.log();
    }

    // Test with anon key
    if (anonKey) {
      console.log("2. Testing with Anon Key (respects RLS):");
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseAnon = createClient(url!, anonKey);
      
      const { data: restaurants, error: anonError } = await supabaseAnon
        .from("restaurants")
        .select("*")
        .order("name");

      if (anonError) {
        console.error(`   ❌ Error: ${anonError.message}`);
        console.error(`   Code: ${anonError.code}`);
      } else {
        console.log(`   ✅ Found ${restaurants?.length || 0} restaurants:`);
        restaurants?.forEach((r: any) => {
          console.log(`      - ${r.name} (${r.id})`);
        });
      }
      console.log();
    }

    // Test with getSupabaseClient (our wrapper)
    console.log("3. Testing with getSupabaseClient (our wrapper):");
    const supabase = getSupabaseClient();
    const { data: restaurants, error: wrapperError } = await supabase
      .from("restaurants")
      .select("*")
      .order("name");

    if (wrapperError) {
      console.error(`   ❌ Error: ${wrapperError.message}`);
      console.error(`   Code: ${wrapperError.code}`);
    } else {
      console.log(`   ✅ Found ${restaurants?.length || 0} restaurants:`);
      restaurants?.forEach((r: any) => {
        console.log(`      - ${r.name} (${r.id})`);
      });
    }
    console.log();

    // Check RLS status
    console.log("4. Checking RLS status:");
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createClient(url!, serviceKey || anonKey!);
    
    const { data: rlsStatus, error: rlsError } = await supabaseAdmin
      .rpc('exec_sql', {
        query: `
          SELECT tablename, rowsecurity 
          FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename = 'restaurants';
        `
      })
      .catch(() => ({ data: null, error: { message: "Cannot check RLS status (requires direct SQL access)" } }));

    if (rlsError) {
      console.log(`   ⚠️  Cannot check RLS status directly`);
      console.log(`   💡 Try running this in Supabase SQL Editor:`);
      console.log(`      SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'restaurants';`);
    } else {
      console.log(`   RLS Status: ${JSON.stringify(rlsStatus, null, 2)}`);
    }

  } catch (error) {
    console.error("\n❌ Error:", error);
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
      console.error(`   ${error.stack}`);
    }
  }
}

testRestaurants();

