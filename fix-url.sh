#!/bin/bash
echo "🔧 Fixing Supabase URL in .env.local..."
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found"
    exit 1
fi

# Check current URL
CURRENT_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL" .env.local | cut -d '=' -f2)
echo "Current URL: $CURRENT_URL"

# Fix .com to .co if needed
if [[ $CURRENT_URL == *".supabase.com"* ]]; then
    echo "⚠️  Found .supabase.com - changing to .supabase.co"
    sed -i '' 's/\.supabase\.com/.supabase.co/g' .env.local
    echo "✅ URL fixed!"
    echo ""
    echo "New URL:"
    grep "NEXT_PUBLIC_SUPABASE_URL" .env.local
else
    echo "✅ URL already uses .supabase.co"
fi

echo ""
echo "🧪 Testing connection..."
npm run test-connection
