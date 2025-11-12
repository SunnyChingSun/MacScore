import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

async function checkRLSPolicies() {
  console.log("🔍 Checking RLS Status and Policies");
  console.log("====================================\n");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error("❌ Missing Supabase credentials");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey);

  // Check RLS status using a direct SQL query
  console.log("1. Checking RLS status on restaurants table:");
  try {
    // Try to check RLS status (this requires direct SQL access)
    let data, error;
    try {
      const result = await supabase.rpc('exec_sql', {
        query: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'restaurants';`
      });
      data = result.data;
      error = result.error;
    } catch (e) {
      data = null;
      error = { message: "Cannot execute SQL directly" };
    }

    if (error && error.message === "Cannot execute SQL directly") {
      console.log("   ⚠️  Cannot check RLS status via API");
      console.log("   💡 Run this in Supabase SQL Editor:");
      console.log("      SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'restaurants';");
    } else if (error) {
      console.error("   ❌ Error:", error.message);
    } else {
      console.log("   Result:", JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.log("   ⚠️  Cannot check RLS status directly");
  }

  // Check policies
  console.log("\n2. Checking RLS policies:");
  try {
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'restaurants')
      .catch(() => ({ data: null, error: { message: "Cannot query policies directly" } }));

    if (policiesError && policiesError.message === "Cannot query policies directly") {
      console.log("   ⚠️  Cannot check policies via API");
      console.log("   💡 Run this in Supabase SQL Editor:");
      console.log("      SELECT * FROM pg_policies WHERE tablename = 'restaurants';");
    } else if (policiesError) {
      console.error("   ❌ Error:", policiesError.message);
    } else {
      if (policies && policies.length > 0) {
        console.log(`   ⚠️  Found ${policies.length} policy/policies on restaurants table:`);
        policies.forEach((p: any) => {
          console.log(`      - ${p.policyname}: ${p.cmd} (${p.qual})`);
        });
      } else {
        console.log("   ✅ No policies found");
      }
    }
  } catch (err) {
    console.log("   ⚠️  Cannot check policies directly");
  }

  // Test query with different approaches
  console.log("\n3. Testing different query approaches:");
  
  // Test 1: Simple select
  const { data: data1, error: error1 } = await supabase
    .from("restaurants")
    .select("*");
  console.log(`   Simple select: ${data1?.length || 0} restaurants`);
  if (data1 && data1.length > 0) {
    console.log(`   Names: ${data1.map((r: any) => r.name).join(", ")}`);
  }
  if (error1) {
    console.error(`   Error: ${error1.message}`);
  }

  // Test 2: Select with order
  const { data: data2, error: error2 } = await supabase
    .from("restaurants")
    .select("*")
    .order("name");
  console.log(`   Select with order: ${data2?.length || 0} restaurants`);
  if (error2) {
    console.error(`   Error: ${error2.message}`);
  }

  // Test 3: Select specific columns
  const { data: data3, error: error3 } = await supabase
    .from("restaurants")
    .select("id, name");
  console.log(`   Select specific columns: ${data3?.length || 0} restaurants`);
  if (error3) {
    console.error(`   Error: ${error3.message}`);
  }

  // Test 4: Count
  const { count, error: countError } = await supabase
    .from("restaurants")
    .select("*", { count: "exact", head: true });
  console.log(`   Count: ${count} restaurants`);
  if (countError) {
    console.error(`   Error: ${countError.message}`);
  }

  console.log("\n4. Recommendations:");
  if (data1 && data1.length < 10) {
    console.log("   ⚠️  Only found", data1.length, "restaurant(s)");
    console.log("   💡 This suggests RLS is still enabled or there are filtering policies");
    console.log("   💡 Run this SQL in Supabase SQL Editor:");
    console.log("      ALTER TABLE restaurants DISABLE ROW LEVEL SECURITY;");
    console.log("      DROP POLICY IF EXISTS \"*\" ON restaurants;");
  } else if (data1 && data1.length === 10) {
    console.log("   ✅ Found all 10 restaurants!");
  }
}

checkRLSPolicies().catch(console.error);

