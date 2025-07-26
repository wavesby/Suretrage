import { MatchOdds } from './arbitrage';

/**
 * This file previously contained mock data for the application.
 * It has been completely refactored to use real data from The Odds API.
 * 
 * Real data is now fetched from:
 * 1. The Odds API (primary source)
 * 2. Web scrapers (fallback/supplementary source)
 * 
 * @see /src/lib/oddsApiAdapter.ts for The Odds API integration
 * @see /src/lib/api.ts for the combined API approach
 */

// Empty mock odds array - the application will now use real data from the API
export const mockOdds: MatchOdds[] = [];

// User data generator for testing purposes only
// This is kept for testing the authentication flow
export const generateMockUser = (isAdmin: boolean = false) => {
  return {
    id: `user-${Date.now()}`,
    email: isAdmin ? 'admin@sportarbitrage.com' : `user${Math.floor(Math.random() * 9000) + 1000}@example.com`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    email_confirmed_at: new Date().toISOString(),
    user_metadata: {
      role: isAdmin ? 'admin' : 'user',
      name: isAdmin ? 'Admin User' : `Test User ${Math.floor(Math.random() * 100) + 1}`
    }
  };
};