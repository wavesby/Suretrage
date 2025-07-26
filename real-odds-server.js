import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
dotenv.config();

// Import the Real Odds API Manager and data adapter
import RealOddsApiManager from './real-odds-api-manager.js';
import { transformOddsApiData } from './src/lib/oddsApiAdapter.js';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Initialize the Real Odds API Manager
const oddsManager = new RealOddsApiManager();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    uptime: process.uptime(),
    mode: 'real-data-only'
  });
});

// Main endpoint to get all odds
app.get('/api/odds', async (req, res) => {
  try {
    console.log('Fetching all odds data...');
    
    // Try to load from the public API directory (most up-to-date)
    const oddsFile = path.join(__dirname, 'public', 'api', 'odds-data.json');
    
    if (existsSync(oddsFile)) {
      const data = await fs.readFile(oddsFile, 'utf-8');
      const oddsData = JSON.parse(data);
      
          if (oddsData && oddsData.length > 0) {
      // Transform the data to match frontend expectations
      const transformedData = transformOddsApiData(oddsData);
      console.log(`Serving ${transformedData.length} transformed events from cache`);
      return res.json(transformedData);
    }
    }
    
    // If no cached data available, fetch fresh data
    console.log('No cached data found, fetching fresh data...');
    const freshData = await oddsManager.fetchFreshOddsData();
    
    if (!freshData || freshData.length === 0) {
      return res.status(404).json({
        error: 'No odds data available',
        message: 'Failed to fetch odds data from API'
      });
    }
    
    // Transform the data to match frontend expectations
    const transformedData = transformOddsApiData(freshData);
    console.log(`Serving ${transformedData.length} transformed events from fresh API data`);
    res.json(transformedData);
  } catch (error) {
    console.error('Error fetching odds data:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve odds data',
      message: error.message
    });
  }
});

// Get odds for a specific bookmaker
app.get('/api/odds/:bookmaker', async (req, res) => {
  try {
    const { bookmaker } = req.params;
    console.log(`Fetching odds for ${bookmaker}...`);
    
    // Standardize bookmaker name
    const standardizedBookmaker = bookmaker.toLowerCase();
    
    // Try to load from the public API directory
    const oddsFile = path.join(__dirname, 'public', 'api', 'odds-data.json');
    
    if (existsSync(oddsFile)) {
      const data = await fs.readFile(oddsFile, 'utf-8');
      const allOdds = JSON.parse(data);
      
      if (allOdds && allOdds.length > 0) {
        // Filter by bookmaker
        const filteredOdds = allOdds.filter(event => 
          event.bookmakers && event.bookmakers.some(bm => 
            (bm.key && bm.key.toLowerCase() === standardizedBookmaker) || 
            (bm.name && bm.name.toLowerCase() === standardizedBookmaker)
          )
        );
        
        if (filteredOdds.length > 0) {
          // Transform the data to match frontend expectations
          const transformedData = transformOddsApiData(filteredOdds);
          console.log(`Serving ${transformedData.length} transformed events for ${bookmaker} from cache`);
          return res.json(transformedData);
        }
      }
    }
    
    // If no cached data available, fetch fresh data
    console.log(`No cached data found for ${bookmaker}, fetching fresh data...`);
    const freshData = await oddsManager.fetchFreshOddsData();
    
    if (!freshData || freshData.length === 0) {
      return res.status(404).json({
        error: 'No odds data available',
        message: `Failed to fetch odds data for ${bookmaker}`
      });
    }
    
    // Filter for the requested bookmaker
    const filteredFreshData = freshData.filter(event => 
      event.bookmakers && event.bookmakers.some(bm => 
        (bm.key && bm.key.toLowerCase() === standardizedBookmaker) || 
        (bm.name && bm.name.toLowerCase() === standardizedBookmaker)
      )
    );
    
    if (filteredFreshData.length === 0) {
      return res.status(404).json({
        error: 'No odds data available',
        message: `No data available for bookmaker: ${bookmaker}`
      });
    }
    
    // Transform the data to match frontend expectations
    const transformedData = transformOddsApiData(filteredFreshData);
    console.log(`Serving ${transformedData.length} transformed events for ${bookmaker} from fresh API data`);
    res.json(transformedData);
  } catch (error) {
    console.error(`Error fetching odds for ${req.params.bookmaker}:`, error);
    res.status(500).json({ 
      error: 'Failed to retrieve odds data',
      message: error.message
    });
  }
});

// Get live odds
app.get('/api/live-odds', async (req, res) => {
  try {
    console.log('Fetching live odds data...');
    
    // Try to load from the public API directory
    const liveOddsFile = path.join(__dirname, 'public', 'api', 'live-odds-data.json');
    
    if (existsSync(liveOddsFile)) {
      const data = await fs.readFile(liveOddsFile, 'utf-8');
      const liveOddsData = JSON.parse(data);
      
      if (liveOddsData && liveOddsData.length > 0) {
        // Transform the data to match frontend expectations
        const transformedData = transformOddsApiData(liveOddsData);
        console.log(`Serving ${transformedData.length} transformed live events from cache`);
        return res.json(transformedData);
      }
    }
    
    // If no cached data available, fetch fresh data
    console.log('No cached live data found, fetching fresh data...');
    const freshLiveData = await oddsManager.fetchFreshLiveOddsData();
    
    if (!freshLiveData || freshLiveData.length === 0) {
      return res.status(404).json({
        error: 'No live odds data available',
        message: 'Failed to fetch live odds data from API'
      });
    }
    
    // Transform the data to match frontend expectations
    const transformedData = transformOddsApiData(freshLiveData);
    console.log(`Serving ${transformedData.length} transformed live events from fresh API data`);
    res.json(transformedData);
  } catch (error) {
    console.error('Error fetching live odds data:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve live odds data',
      message: error.message
    });
  }
});

// Force refresh endpoint (for admin/testing)
app.post('/api/refresh-odds', async (req, res) => {
  try {
    console.log('Force refreshing odds data...');
    
    // Force refresh all odds data
    const result = await oddsManager.refreshAllOdds(true);
    
    res.json({
      success: true,
      message: 'Odds data refreshed successfully',
      timestamp: new Date().toISOString(),
      liveEventsCount: result.live.length,
      preMatchEventsCount: result.preMatch.length,
      combinedEventsCount: result.combined.length
    });
  } catch (error) {
    console.error('Error refreshing odds data:', error);
    res.status(500).json({ 
      error: 'Failed to refresh odds data',
      message: error.message
    });
  }
});

// Add a fallback route handler for any other API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Real Odds API Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api/odds`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
  
  // Perform an initial data fetch
  console.log('Performing initial data fetch...');
  oddsManager.refreshAllOdds().then(result => {
    console.log(`Preloaded ${result.combined.length} events`);
  }).catch(error => {
    console.error('Error during initial data fetch:', error.message);
  });
}); 