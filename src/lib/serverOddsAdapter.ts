// This file is used server-side only and will not be imported in client code
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';
import { MatchOdds } from '@/utils/arbitrage';

// Define the Odds API data structure (same as oddsApiAdapter.ts)
interface OddsApiEvent {
  id: string;
  sport: string;
  league: string;
  startTime: string;
  homeTeam: string;
  awayTeam: string;
  bookmakers: {
    name: string;
    key: string;
    lastUpdate: string;
    markets: {
      type: string;
      outcomes: {
        name: string;
        price: number;
        point?: number | null;
        description?: string | null;
      }[];
    }[];
  }[];
}

// Function to load data from the Odds API output file (server-side only)
export async function loadServerOddsData(): Promise<any[]> {
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const filePath = path.join(__dirname, '..', '..', 'odds-data', 'arbitrage-ready.json');
    
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (fileError) {
      console.error('Error reading odds file:', fileError);
      
      // Fallback to another file if main file not found
      const fallbackPath = path.join(__dirname, '..', '..', 'odds-data', 'api-odds-all.json');
      try {
        const fallbackData = await fs.readFile(fallbackPath, 'utf-8');
        return JSON.parse(fallbackData);
      } catch (fallbackError) {
        console.error('Error reading fallback odds file:', fallbackError);
        return [];
      }
    }
  } catch (error) {
    console.error('Error loading server-side odds data:', error);
    return [];
  }
}

// Export any other server-side only functions here 