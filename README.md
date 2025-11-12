# MacScore

**Fast food, smarter choices.**

MacScore is a smart nutrition calculator and health-index tool for fast-food meals. It provides real-time health scores (0-100) based on calories, macros, sodium, fiber, and sugar, allowing users to make informed choices about their fast-food meals.

## Features

- 🔍 **Menu Search**: Search for fast-food items across restaurants
- 📊 **Health Scoring**: Get instant health scores (0-100) for any meal
- ✏️ **Meal Customization**: Add, remove, or modify ingredients to see real-time nutrition updates
- 📈 **Nutrition Breakdown**: Visual nutrition bars showing calories, macros, and more
- 🏆 **Badges**: Earn badges for healthy choices (High Protein, Low Sodium, etc.)
- 💾 **Local Storage**: Save your meal tray and customizations locally
- 🎨 **Modern UI**: Clean, responsive design with playful elements

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: Supabase (Postgres) or direct Postgres
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Styling**: Tailwind CSS
- **Validation**: Zod

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or Supabase account)
- Environment variables configured

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd MacScore
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

**Option A: Use the setup script (recommended):**
```bash
./setup-env.sh
```

**Option B: Manual setup:**
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your database credentials. See [DATABASE_SETUP.md](DATABASE_SETUP.md) for detailed instructions.

**For Supabase:**
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**For Direct Postgres:**
```
DATABASE_URL=postgresql://user:password@localhost:5432/macscore
```

4. Set up the database:

Run the migration SQL file in your database:
```bash
# For Supabase, use the Supabase dashboard SQL editor
# For Postgres, run:
psql -d macscore -f supabase/migrations/001_initial_schema.sql
```

5. Seed the database:
```bash
npm run seed
```

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
MacScore/
├── app/                    # Next.js app router
│   ├── (dashboard)/       # Dashboard routes
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── dashboard/         # Dashboard components
│   ├── meal-builder/      # Meal customization UI
│   ├── score-display/     # Score visualization
│   └── ui/                # Reusable UI components
├── lib/                   # Utilities and services
│   ├── db/                # Database client and queries
│   ├── services/          # Business logic
│   └── store/             # Zustand stores
├── data/                  # Seed data
├── supabase/              # Database migrations
└── types/                 # TypeScript types
```

## API Routes

- `GET /api/menu/search` - Search menu items
- `GET /api/items/[id]` - Get item details
- `POST /api/items/[id]/customize` - Customize item
- `GET /api/score/[id]` - Calculate score
- `GET /api/swaps/[id]` - Get swap suggestions
- `POST /api/presets` - Save user preset

## Database Schema

The database includes the following tables:

- `restaurants` - Fast-food chains
- `items` - Menu items with nutrition data
- `ingredients` - Individual ingredients
- `item_ingredients` - Junction table
- `allergens` - Allergen types
- `item_allergens` - Junction table
- `score_profiles` - Scoring weight profiles
- `item_scores` - Cached scores
- `user_presets` - Saved customizations

## Scoring Algorithm

The health score (0-100) is calculated using weighted components:

- Calories: 20%
- Protein: 15%
- Carbs: 15%
- Fat: 15%
- Sodium: 15%
- Fiber: 10%
- Sugar: 10%

Each component is normalized to a 0-100 scale based on reference values, then weighted and summed.

## Customization

Users can:
- Add ingredients to items
- Remove ingredients from items
- Modify ingredient quantities (50%, 150%, etc.)
- See real-time nutrition and score updates
- Save customizations to meal tray

## Local Storage

The app uses localStorage to persist:
- Meal tray (selected items)
- Customizations
- Last viewed items

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Lint code
npm run lint

# Seed database
npm run seed
```

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
