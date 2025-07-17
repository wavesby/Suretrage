import axios from 'axios';
import { MatchOdds } from '@/utils/arbitrage';

// Define the supported bookmakers for scraping
export const SCRAPABLE_BOOKMAKERS = [
  'Bet9ja',
  '1xBet',
  'BetKing',
  'SportyBet'
];

// Configuration for each bookmaker's scraping
interface ScraperConfig {
  url: string;
  headers: Record<string, string>;
  selector: string;
  transform: (html: string) => Promise<MatchOdds[]>;
}

// Scraper configurations for each bookmaker
const SCRAPER_CONFIG: Record<string, ScraperConfig> = {
  'Bet9ja': {
    url: 'https://web.bet9ja.com/Sport/Default.aspx',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    },
    selector: '#odds-data-container',
    transform: async (html: string): Promise<MatchOdds[]> => {
      try {
        // In a real implementation, we would parse the HTML here
        // For now, we'll throw an error to indicate this needs implementation
        throw new Error('Bet9ja scraper implementation needed');
      } catch (error) {
        console.error('Error transforming Bet9ja data:', error);
        throw error;
      }
    }
  },
  '1xBet': {
    url: 'https://1xbet.ng/en/line/football',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    },
    selector: '.c-events__item',
    transform: async (html: string): Promise<MatchOdds[]> => {
      try {
        // In a real implementation, we would parse the HTML here
        // For now, we'll throw an error to indicate this needs implementation
        throw new Error('1xBet scraper implementation needed');
      } catch (error) {
        console.error('Error transforming 1xBet data:', error);
        throw error;
      }
    }
  },
  'BetKing': {
    url: 'https://www.betking.com/sports/s/event/p/soccer',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    },
    selector: '.event-list',
    transform: async (html: string): Promise<MatchOdds[]> => {
      try {
        // In a real implementation, we would parse the HTML here
        // For now, we'll throw an error to indicate this needs implementation
        throw new Error('BetKing scraper implementation needed');
      } catch (error) {
        console.error('Error transforming BetKing data:', error);
        throw error;
      }
    }
  },
  'SportyBet': {
    url: 'https://www.sportybet.com/ng/sport/football',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    },
    selector: '.market-events',
    transform: async (html: string): Promise<MatchOdds[]> => {
      try {
        // In a real implementation, we would parse the HTML here
        // For now, we'll throw an error to indicate this needs implementation
        throw new Error('SportyBet scraper implementation needed');
      } catch (error) {
        console.error('Error transforming SportyBet data:', error);
        throw error;
      }
    }
  }
};

/**
 * Scrape odds from a specific bookmaker
 * @param bookmaker The bookmaker to scrape
 * @returns Promise with the scraped and normalized odds
 */
export const scrapeBookmakerOdds = async (bookmaker: string): Promise<MatchOdds[]> => {
  try {
    if (!SCRAPABLE_BOOKMAKERS.includes(bookmaker)) {
      throw new Error(`Unsupported bookmaker for scraping: ${bookmaker}`);
    }

    const config = SCRAPER_CONFIG[bookmaker];
    
    // In a real implementation, we would use a headless browser like Puppeteer
    // For now, we'll make a direct request and process the HTML
    const response = await axios.get(config.url, {
      headers: config.headers,
      timeout: 15000 // 15 second timeout
    });

    // Extract the relevant data using the transform function
    return await config.transform(response.data);
  } catch (error) {
    console.error(`Error scraping ${bookmaker}:`, error);
    throw new Error(`Failed to scrape odds from ${bookmaker}`);
  }
};

/**
 * Scrape odds from multiple bookmakers
 * @param bookmakers List of bookmakers to scrape
 * @returns Promise with all scraped and normalized odds
 */
export const scrapeMultipleBookmakers = async (bookmakers: string[] = SCRAPABLE_BOOKMAKERS): Promise<MatchOdds[]> => {
  const validBookmakers = bookmakers.filter(bk => SCRAPABLE_BOOKMAKERS.includes(bk));
  
  if (validBookmakers.length === 0) {
    throw new Error('No valid bookmakers selected for scraping');
  }

  console.log(`Starting to scrape odds from ${validBookmakers.length} bookmakers`);
  
  // Scrape each bookmaker in parallel
  const scrapingPromises = validBookmakers.map(bookmaker => scrapeBookmakerOdds(bookmaker));
  const settledResults = await Promise.allSettled(scrapingPromises);
  
  // Process results, including only the successful ones
  const successfulResults: MatchOdds[][] = [];
  const failedBookmakers: string[] = [];
  
  settledResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successfulResults.push(result.value);
    } else {
      failedBookmakers.push(validBookmakers[index]);
      console.error(`Failed to scrape odds from ${validBookmakers[index]}:`, result.reason);
    }
  });
  
  // If all bookmakers failed, throw an error
  if (successfulResults.length === 0) {
    throw new Error(`Failed to scrape odds from all bookmakers: ${failedBookmakers.join(', ')}`);
  }
  
  // Flatten the results
  const allOdds = successfulResults.flat();
  console.log(`Successfully scraped ${allOdds.length} odds from ${successfulResults.length}/${validBookmakers.length} bookmakers`);
  
  return allOdds;
};

/**
 * Proxy function to handle scraping or API fetching based on availability
 * @param bookmakers List of bookmakers to get odds for
 * @returns Promise with all odds
 */
export const getOddsFromSources = async (bookmakers: string[]): Promise<MatchOdds[]> => {
  try {
    // First try to get odds from API
    const { fetchAllOdds } = await import('@/lib/api');
    return await fetchAllOdds(bookmakers);
  } catch (apiError) {
    console.error('API fetching failed:', apiError);
    
    // Fall back to scraping
    console.log('API failed, falling back to scraper');
    return await scrapeMultipleBookmakers(bookmakers);
  }
};

// Implementation note:
// In a production environment, web scraping should be done server-side to avoid CORS issues
// and to prevent exposing the scraping logic to clients. This implementation is for
// demonstration purposes only and would need to be moved to a backend service in production. 