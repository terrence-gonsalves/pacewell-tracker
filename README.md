# Pacewell Tracker

**Version: 0.4.0-alpha**

A dynamic calorie tracking web application that adjusts calorie targets based on real-time weight changes. Pacewell Tracker helps users achieve their fitness goals with personalized macro targets and progress insights.

## Features

### ✅ Completed (Phase 4A)
- **User Authentication**
  - Email/password signup with biometric data collection
  - Email verification via Supabase
  - Secure login/logout
  - Persistent sessions with localStorage

- **User Onboarding**
  - Multi-step signup form (email/password → biometrics → goals)
  - Support for metric and imperial units
  - Body composition tracking (measured and target body fat %)
  - Activity level and fitness goal selection

- **Authentication Flow**
  - Landing page with app overview
  - Login and signup pages
  - Protected dashboard (redirects to login if not authenticated)
  - Email-based account verification

### 🚀 In Progress (Phase 4B)
- Dashboard with stat cards
- Weight and macro logging modals
- Body fat tracking
- Progress visualizations and charts

### 📋 Planned
- Meal database integration
- Barcode scanning for food logging
- Weight trend analysis
- Custom macro ratio support
- Mobile app (React Native)
- API integrations with fitness trackers
- Advanced analytics and insights

## Tech Stack

### Frontend
- **Framework:** Next.js 13+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** React Context API
- **Authentication:** Supabase Auth

### Backend
- **Database:** PostgreSQL (via Supabase)
- **API:** Next.js API Routes
- **Authentication:** Supabase
- **Hosting:** Vercel (configured)

### Libraries & Tools
- Supabase JS Client
- React Hooks
- Next.js middleware

## Project Structure

```
app/
├── page.tsx                    # Landing page
├── login/page.tsx             # Login page
├── signup/page.tsx            # Signup form (3-step)
├── dashboard/page.tsx         # Dashboard (protected)
├── api/
│   └── auth/
│       ├── signup/route.ts    # Signup API endpoint
│       └── login/route.ts     # Login API endpoint
├── context/
│   └── AuthContext.tsx        # Auth state management
├── components/
│   └── ProtectedRoute.tsx     # Auth guard component
└── layout.tsx                 # Root layout with AuthProvider

lib/
├── supabase.ts                # Supabase clients (regular + admin)
├── calculations.ts            # Calorie & macro calculations
├── conversions.ts             # Metric/imperial conversion utilities
├── utils.ts                   # Helper functions & validation
└── auth.ts                    # Auth utilities

database/
├── migrations/
│   ├── initial_schema.sql
│   ├── add_unit_preference.sql
│   └── body_fat_logs.sql
└── rls_policies.sql           # Row-level security policies
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (free tier works)
- Git

### 1. Clone & Install
```bash
git clone <repository>
cd pacewell-tracker
npm install
```

### 2. Environment Variables
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Get these from Supabase Dashboard → Project Settings → API

### 3. Database Setup
1. Create a new Supabase project
2. Run migrations in SQL Editor:
   - `initial_schema.sql` - Creates users table with indexes
   - `add_unit_preference.sql` - Adds unit preference column
   - `body_fat_logs.sql` - Creates body fat tracking table with RLS
3. Create RLS policies (see `rls_policies.sql`)

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Test the App
1. Go to landing page
2. Click "Register" 
3. Fill signup form (3 steps)
4. Check email for confirmation link
5. Click confirmation link to verify
6. Return to app and login
7. Access dashboard

## Key Concepts

### Calculations
The app uses the **Mifflin-St Jeor formula** for BMR and adjusts calorie targets based on:
- User weight, height, age, sex, activity level
- Fitness goal (Fat Loss / Muscle Gain)
- Intensity level (Slow / Moderate / Aggressive / Extreme / Insane)
- Daily weight changes (dynamic adjustment)

### Unit Support
Users can choose metric (kg/cm) or imperial (lbs/ft-in) at signup. The app:
- Stores all data in metric (kg, cm) internally
- Displays in user's preferred unit
- Converts between systems seamlessly

### Body Fat Tracking
- Users can input measured body fat %
- Tracks changes over time in `body_fat_logs` table
- Estimates goal completion date
- Supports both measured and calculated body fat

### Authentication Security
- Email verification required before login
- Service role key used for signup (bypasses RLS)
- User RLS policies restrict data access to own records
- Sessions stored in localStorage (token + user data)

## Current Status

**Phase 4A: Authentication** ✅ COMPLETE
- Landing page, login, signup, email verification all working
- User can register and login successfully
- Dashboard is protected and redirects unauthenticated users to login

**Phase 4B: Dashboard** 🚧 IN PROGRESS
- Dashboard shell with header and logout button
- Next: Add stat cards, logging modals, charts

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account with biometrics
- `POST /api/auth/login` - Login with email/password

### Dashboard
- `GET /api/dashboard` - Fetch user stats and today's logs (requires auth)

## Known Issues

None currently. Email verification is working with Supabase's built-in flow.

## Development Notes

### Version Numbering
- **0.x.x** = Active development, feature incomplete
- **1.0.0** = Production ready
- **-alpha** suffix = Early testing, may have bugs
- **-beta** suffix = Feature complete, stability testing

### Database Constraints
- Body fat % stored as decimal (0-1), not percentage (0-100)
  - User enters 23.9%, API converts to 0.239 before insert
- Weight must be 30-500 kg (validated in API)
- Height must be 100-250 cm (approximately 3'3" to 8'2")
- Age must be 15-120 years

## Next Steps

1. **Complete Phase 4B:** Build dashboard components
   - Stat cards (current weight, remaining calories, macros, body fat %)
   - Logging modals (weight, meals, body fat)
   - Progress charts (weight trend, calorie intake)

2. **Phase 4C:** Connect dashboard to real data
   - Fetch user profile and today's logs from `/api/dashboard`
   - Display dynamic metrics

3. **Phase 5:** Advanced features
   - Meal database
   - Weekly projections
   - Mobile responsiveness improvements
   - Performance optimization

## Contributing

This is a personal project. Feedback welcome!

## License

Private (not open source)

## Support

For issues or questions, contact the developer.

---

**Last Updated:** May 20, 2026
**Current Phase:** 4A (Authentication) Complete, 4B (Dashboard) In Progress