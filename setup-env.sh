#!/bin/bash

# MacScore Environment Setup Script

echo "🍔 MacScore Database Setup"
echo "=========================="
echo ""

# Check if .env.local already exists
if [ -f .env.local ]; then
    echo "⚠️  .env.local already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted. Exiting."
        exit 1
    fi
fi

echo "Which database do you want to use?"
echo "1) Supabase (Recommended - Free tier available)"
echo "2) Direct Postgres connection"
read -p "Enter your choice (1 or 2): " db_choice

if [ "$db_choice" == "1" ]; then
    echo ""
    echo "📦 Supabase Setup"
    echo "================="
    echo "1. Go to https://app.supabase.com"
    echo "2. Create a new project (or use existing)"
    echo "3. Go to Settings → API"
    echo "4. Copy your Project URL, anon public key, and service_role key"
    echo ""
    read -p "Enter your Supabase Project URL: " supabase_url
    read -p "Enter your Supabase anon public key: " supabase_anon_key
    read -p "Enter your Supabase service_role key: " supabase_service_key
    
    cat > .env.local << EOL
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=$supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=$supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=$supabase_service_key

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOL
    
    echo ""
    echo "✅ Supabase configuration saved to .env.local"
    echo ""
    echo "📝 Next steps:"
    echo "1. Run the database migration in Supabase SQL Editor:"
    echo "   - Copy contents of supabase/migrations/001_initial_schema.sql"
    echo "   - Paste into Supabase SQL Editor and run"
    echo "2. Run: npm run seed"
    echo "3. Run: npm run dev"

elif [ "$db_choice" == "2" ]; then
    echo ""
    echo "🐘 Postgres Setup"
    echo "================="
    read -p "Enter your Postgres connection string (postgresql://user:password@host:port/database): " db_url
    
    cat > .env.local << EOL
# Postgres Configuration
DATABASE_URL=$db_url

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOL
    
    echo ""
    echo "✅ Postgres configuration saved to .env.local"
    echo ""
    echo "📝 Next steps:"
    echo "1. Run the database migration:"
    echo "   psql \$DATABASE_URL -f supabase/migrations/001_initial_schema.sql"
    echo "2. Run: npm run seed"
    echo "3. Run: npm run dev"
else
    echo "❌ Invalid choice. Exiting."
    exit 1
fi

echo ""
echo "✨ Setup complete!"
