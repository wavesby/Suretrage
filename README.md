# Sport Arbitrage

A real-time sports arbitrage platform that helps users find and act on arbitrage opportunities across multiple Nigerian bookmakers.

![Sport Arbitrage Platform](https://img.shields.io/badge/Sport%20Arbitrage-v1.0-blue)
![React](https://img.shields.io/badge/React-18.x-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.x-38B2AC)
![License](https://img.shields.io/badge/License-MIT-green)

## What is Sports Arbitrage?

Sports arbitrage is a strategy where you place bets on all possible outcomes of a sporting event across different bookmakers, taking advantage of discrepancies in odds to guarantee a profit regardless of the outcome.

### How It Works

1. **Find Odds Discrepancies**: Our system monitors odds from multiple bookmakers in real-time
2. **Calculate Profit Potential**: We automatically calculate the arbitrage percentage and potential profit
3. **Distribute Stakes Optimally**: Our algorithm determines the optimal stake for each outcome
4. **Place Bets**: Users place bets according to the calculated stakes
5. **Profit Guaranteed**: Regardless of the event outcome, a profit is secured

## Features

- **Real-time Arbitrage Opportunities**: Continuously monitors odds from multiple bookmakers to find profitable arbitrage opportunities
- **Smart Stake Calculator**: Automatically calculates optimal stake distribution for maximum profit
- **Risk Assessment**: Advanced algorithms to evaluate the risk level of each opportunity
- **Bookmaker Selection**: Customize which bookmakers to monitor
- **User Authentication**: Secure login and account management via Supabase
- **Mobile-First Design**: Responsive interface optimized for mobile devices
- **PWA Support**: Install as a Progressive Web App for offline capabilities
- **Notification System**: Get alerts for new high-profit opportunities
- **Customizable Settings**: Set default stake amount and notification preferences
- **Admin Panel**: Manage users and seed test data (admin accounts only)

## Supported Bookmakers

Currently supports odds from:
- Bet9ja
- 1xBet
- BetKing
- SportyBet
- NairaBet
- MerryBet
- BetWay
- BangBet
- AccessBet
- BetWinner
- Betano
- SuperBet
- Parimatch
- LiveScore Bet
- MSport

## Screenshots

<details>
<summary>View Application Screenshots</summary>

*Screenshots will be added here*

</details>

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or Yarn
- Supabase account (optional for full functionality)
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/sport-arbitrage.git
   cd sport-arbitrage
   ```

2. Install dependencies:
   ```bash
   npm install
   # or with yarn
   yarn install
   ```

3. Create a `.env` file in the root directory with the following content:
   ```
   # Supabase Configuration (optional)
   VITE_SUPABASE_URL=https://your-supabase-url.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

   # Bookmaker API Keys (optional)
   VITE_BET9JA_API_KEY=your-bet9ja-api-key
   VITE_BET9JA_API_URL=https://odds-api.bet9ja.com/v1/odds/football/main
   VITE_ONEXBET_API_KEY=your-1xbet-api-key
   VITE_ONEXBET_API_URL=https://ng-api.1xbet.com/sports/line/football
   VITE_BETKING_API_KEY=your-betking-api-key
   VITE_BETKING_API_URL=https://api.betking.com/api/feeds/v1/odds/football
   VITE_SPORTYBET_API_KEY=your-sportybet-api-key
   VITE_SPORTYBET_API_URL=https://api.sportybet.com/ng/api/v1/odds/football

   # Feature Flags
   VITE_USE_MOCK_DATA=true
   VITE_ENABLE_NOTIFICATIONS=true
   VITE_ENABLE_REAL_TIME_UPDATES=true
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or with yarn
   yarn dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

### Production Build

To create a production build:

```bash
npm run build
# or with yarn
yarn build
```

To preview the production build locally:

```bash
npm run preview
# or with yarn
yarn preview
```

### Supabase Setup (Optional)

For full functionality including user authentication and preference storage:

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project
3. Set up the following tables in your Supabase database:

#### `profiles` Table
```sql
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique,
  full_name text,
  avatar_url text,
  is_admin boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table profiles enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using (true);

create policy "Users can insert their own profile."
  on profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile."
  on profiles for update
  using (auth.uid() = id);
```

#### `user_preferences` Table
```sql
create table user_preferences (
  user_id uuid references auth.users on delete cascade primary key,
  default_stake integer default 10000,
  sms_notifications boolean default false,
  phone_number text,
  preferences jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table user_preferences enable row level security;

-- Create policies
create policy "Users can view their own preferences."
  on user_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert their own preferences."
  on user_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own preferences."
  on user_preferences for update
  using (auth.uid() = user_id);
```

4. Update your `.env` file with your Supabase URL and anon key
5. Set `VITE_USE_MOCK_DATA=false` if you have a real API for odds data

## Using the App

### Finding Arbitrage Opportunities

1. Sign in to your account (or use demo mode)
2. Select the bookmakers you want to monitor in the "Bookies" tab
3. Set your total stake amount
4. Browse the opportunities list, sorted by profit percentage
5. Use the filters to narrow down results by profit, risk level, or league
6. Click on an opportunity to view detailed stake distribution

### Placing Bets

1. View the stake distribution for an opportunity
2. Place bets at each bookmaker according to the calculated stakes
3. Ensure you place all bets quickly to avoid odds changes
4. Verify your potential returns match the calculated values

### Bookmaker Selection

1. Navigate to the "Bookies" tab
2. Select the bookmakers you want to monitor
3. Click "Save Selection" to update your preferences
4. The system will automatically refresh odds from your selected bookmakers

### Settings Configuration

1. Navigate to the "Settings" tab
2. Set your default stake amount
3. Configure notification preferences
4. Update your account information
5. Click "Save Settings" to update your preferences

## Development

### Project Structure

```
sport-arbitrage/
├── public/              # Static assets
├── src/
│   ├── components/      # UI components
│   │   ├── admin/       # Admin panel components
│   │   ├── auth/        # Authentication components
│   │   ├── bookmakers/  # Bookmaker selection components
│   │   ├── layout/      # Layout components
│   │   ├── opportunities/ # Arbitrage opportunity components
│   │   ├── settings/    # Settings components
│   │   └── ui/          # UI library components
│   ├── contexts/        # React context providers
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # API and utility libraries
│   ├── pages/           # Main application pages
│   └── utils/           # Helper functions and calculations
├── .env                 # Environment variables
├── index.html           # HTML entry point
├── package.json         # Project dependencies
├── tailwind.config.ts   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
└── vite.config.ts       # Vite configuration
```

### Key Technologies

- **React**: UI library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Build tool
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: UI component library
- **Supabase**: Authentication and database
- **Axios**: HTTP client
- **React Router**: Client-side routing
- **React Query**: Data fetching and caching
- **Lucide React**: Icon library

### Commands

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build locally
- `npm run lint`: Run ESLint

## Troubleshooting

### Common Issues

#### Application Shows Blank Page
- Check browser console for errors
- Ensure environment variables are properly set in `.env`
- Verify that all dependencies are installed with `npm install`

#### No Arbitrage Opportunities Showing
- Ensure you've selected at least 2 bookmakers in the "Bookies" tab
- Check if mock data is enabled in your environment variables
- Try refreshing the data using the refresh button

#### Authentication Issues
- Verify your Supabase configuration in `.env`
- Check browser console for authentication errors
- Clear browser cookies and local storage, then try again

#### API Connection Problems
- Ensure you have valid API keys for the bookmakers
- Check network tab in browser developer tools for failed requests
- Verify your internet connection

### Performance Optimization

- Use the "Select All" or "Clear All" buttons when managing bookmakers to avoid excessive refreshes
- Set a reasonable default stake amount to speed up calculations
- Close the app when not in use to prevent background data refreshing

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This application is for educational purposes only. Sports betting may be subject to legal restrictions in your jurisdiction. Users are responsible for ensuring compliance with local laws and regulations. The developers of this application are not responsible for any financial losses incurred through sports betting.

## Acknowledgments

- Nigerian bookmakers for providing odds data
- The arbitrage betting community for insights and strategies
- Open source libraries and tools that made this project possible

## Contact

For questions, feedback, or support, please contact us at [your-email@example.com](mailto:your-email@example.com).
