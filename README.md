# MacScore

A nutrition tracking and health scoring application that helps you make informed food choices.

## Features

- 🔍 **Search Items**: Search for food items across multiple restaurants
- 🏪 **Restaurant Filtering**: Filter items by restaurant
- 🎨 **Customize Items**: Modify ingredients and quantities
- 📊 **Real-time Nutrition**: See nutrition changes in real-time as you customize
- 💯 **Health Score**: Get a health score for your meal
- 📱 **Meal Tracker**: Build and track your meals
- 🖼️ **Image Support**: View item and restaurant images

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Database**: Supabase (PostgreSQL) or Direct Postgres
- **Deployment**: Vercel, Netlify, Railway, or Render

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (or Postgres database)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd MacScore
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env.local` file:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # OR Postgres Configuration
   DATABASE_URL=your_postgres_connection_string
   ```

4. **Run database migrations**:
   - If using Supabase: Run migrations in Supabase SQL Editor
   - If using Postgres: Run `psql $DATABASE_URL -f supabase/migrations/001_initial_schema.sql`

5. **Seed the database**:
   ```bash
   npm run seed
   ```

6. **Start the development server**:
   ```bash
   npm run dev
   ```

7. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
MacScore/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   └── (dashboard)/       # Dashboard pages
├── components/            # React components
│   ├── dashboard/         # Dashboard components
│   ├── meal-builder/      # Meal builder components
│   └── ui/                # UI components
├── lib/                   # Utility libraries
│   ├── db/               # Database utilities
│   ├── services/         # Business logic
│   └── store/            # Zustand stores
├── scripts/              # Utility scripts
├── supabase/            # Database migrations
└── types/               # TypeScript types
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run seed` - Seed the database with sample data

## Database Setup

### Using Supabase

1. Create a new Supabase project
2. Run migrations from `supabase/migrations/` in the SQL Editor
3. Set up environment variables
4. Run `npm run seed` to populate sample data

### Using Postgres

1. Create a Postgres database
2. Run migrations: `psql $DATABASE_URL -f supabase/migrations/001_initial_schema.sql`
3. Set `DATABASE_URL` environment variable
4. Run `npm run seed` to populate sample data

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Add environment variables
5. Click "Deploy"

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes (if using Supabase) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes (if using Supabase) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes (if using Supabase) |
| `DATABASE_URL` | Postgres connection string | Yes (if using Postgres) |

## Features in Detail

### Search & Filter
- Search items by name across all restaurants
- Filter by restaurant
- Optimized search with PostgreSQL trigram indexes

### Customization
- Modify ingredient quantities (0.0x to 3.0x)
- Remove ingredients
- Real-time nutrition calculation
- Visual feedback for changes

### Meal Tracking
- Add items to meal tray
- Edit items after adding
- View total nutrition
- Calculate meal health score

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on GitHub.
