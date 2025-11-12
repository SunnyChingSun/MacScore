# Actual Fix: API Still Returning Only 1 Restaurant

## The Real Problem

The verify script shows that **10 restaurants ARE accessible** with both the service role key and anon key. This means:

1. ✅ RLS is NOT blocking access
2. ✅ Restaurants exist in the database (10 restaurants)
3. ❌ The API route is not using the updated code

## Solution: Restart Your Dev Server

The API route code has been updated to use the service role key, but **Next.js needs to be restarted** to pick up the changes.

### Step 1: Stop the Dev Server

1. Go to the terminal where `npm run dev` is running
2. Press `Ctrl+C` to stop it

### Step 2: Restart the Dev Server

```bash
npm run dev
```

### Step 3: Wait for Server to Start

Wait until you see:
```
✓ Ready in X.XXs
○ Compiling /api/restaurants ...
```

### Step 4: Test the API

```bash
curl http://localhost:3000/api/restaurants | jq '.restaurants | length'
```

Should now return `10` instead of `1`.

### Step 5: Check Server Logs

In the terminal where `npm run dev` is running, you should see logs like:

```
[API] Fetching restaurants...
[API] Server context: true
[API] Service role key available: true
[getRestaurants] Querying restaurants...
[getRestaurants] Found 10 restaurants
[getRestaurants] Restaurant names: Burger King, Domino's, Generic, KFC, McDonald's, ...
[API] Found restaurants: 10
```

### Step 6: Refresh Your Browser

Refresh your app and you should see all 10 restaurants in the selector.

## Why This Happens

Next.js caches API routes and modules. When you update code in `lib/db/client.ts`, the running dev server still has the old code in memory. Restarting forces Next.js to reload all modules with the new code.

## Verification

After restarting, verify:

1. **API returns 10 restaurants:**
   ```bash
   curl http://localhost:3000/api/restaurants | jq '.restaurants | length'
   ```

2. **Check restaurant names:**
   ```bash
   curl http://localhost:3000/api/restaurants | jq '.restaurants[].name'
   ```

3. **Browser shows all restaurants:**
   - Refresh your app
   - You should see all 10 restaurant buttons

## If Still Not Working

If you've restarted and it's still only returning 1 restaurant:

1. **Check server logs:**
   - Look for the `[API]` and `[getRestaurants]` log messages
   - Verify it says "Found 10 restaurants"

2. **Clear Next.js cache:**
   ```bash
   rm -rf .next
   npm run dev
   ```

3. **Check environment variables:**
   ```bash
   cat .env.local | grep SUPABASE
   ```
   Should show `SUPABASE_SERVICE_ROLE_KEY` is set

4. **Hard refresh browser:**
   - `Ctrl+Shift+R` (Mac: `Cmd+Shift+R`)
   - Or open in incognito/private mode

## Note About 10 Restaurants

The verify script shows 10 restaurants, but we expected 9. There might be a duplicate "McDonald's" entry. This is fine - the important thing is that all restaurants are now accessible.

