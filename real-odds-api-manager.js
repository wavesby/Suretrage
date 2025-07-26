import OddsApiIntegration from './odds-api-integration.js';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
dotenv.config();

// Get the directory name properly in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * RealOddsApiManager - A class to manage real odds data from The Odds API
 * without any mock data fallbacks
 */
class RealOddsApiManager {
  constructor() {
    // Ensure API key is available
    const apiKey = process.env.ODDS_API_KEY;
    if (!apiKey) {
      throw new Error('ODDS API key is required in .env file');
    }
    
    this.integration = new OddsApiIntegration({ apiKey });
    this.outputDir = path.join(__dirname, 'odds-data');
    this.publicApiDir = path.join(__dirname, 'public', 'api');
    
    // Target bookmakers for arbitrage detection - expanded list
    this.targetBookmakers = [
      '1xbet', 'sportybet', 'betway', 'betway_africa',
      'bet365', 'pinnacle', 'marathonbet', 'williamhill', 
      'matchbook', 'bovada', 'fanduel'
    ];
    
    // Initialize
    this._setupDirectories();
  }
  
  async _setupDirectories() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      await fs.mkdir(this.publicApiDir, { recursive: true });
      console.log('Output directories created successfully');
    } catch (error) {
      console.error('Error creating directories:', error.message);
    }
  }
  
  /**
   * Fetch fresh odds data from the API for the target bookmakers
   * @returns {Promise<Object>} The processed odds data
   */
  async fetchFreshOddsData() {
    console.log('Fetching fresh odds data from The Odds API...');
    
    try {
      // Get odds for the target bookmakers
      const oddsData = await this.integration.getOddsForBookmakers(this.targetBookmakers);
      
      if (!oddsData || Object.keys(oddsData).length === 0) {
        console.error('No odds data returned from API');
        return null;
      }
      
      // Process data for arbitrage detection
      const arbitrageData = await this.integration.saveArbitrageData(oddsData);
      
      // Save to public API directory for frontend access
      await this._saveToPublicApi(arbitrageData);
      
      console.log(`Successfully fetched and processed ${arbitrageData.length} events`);
      return arbitrageData;
    } catch (error) {
      console.error('Error fetching fresh odds data:', error.message);
      return null;
    }
  }
  
  /**
   * Fetch fresh live odds data from the API
   * @returns {Promise<Object>} The processed live odds data
   */
  async fetchFreshLiveOddsData() {
    console.log('Fetching fresh live odds data from The Odds API...');
    
    try {
      // Get live odds for the target bookmakers
      const liveOddsData = await this.integration.getLiveOddsForBookmakers(this.targetBookmakers);
      
      if (!liveOddsData || Object.keys(liveOddsData).length === 0) {
        console.error('No live odds data returned from API');
        return null;
      }
      
      // Process data for arbitrage detection
      const liveArbitrageData = await this.integration.saveArbitrageData(liveOddsData, true);
      
      // Save to public API directory for frontend access
      await this._saveToPublicApi(liveArbitrageData, true);
      
      console.log(`Successfully fetched and processed ${liveArbitrageData.length} live events`);
      return liveArbitrageData;
    } catch (error) {
      console.error('Error fetching fresh live odds data:', error.message);
      return null;
    }
  }
  
  /**
   * Refresh all odds data (both pre-match and live)
   * @param {boolean} forceRefresh Whether to force refresh regardless of cache
   * @returns {Promise<Object>} The processed odds data
   */
  async refreshAllOdds(forceRefresh = false) {
    console.log('Refreshing all odds data...');
    
    try {
      const result = await this.integration.refreshAllOdds(this.targetBookmakers, forceRefresh);
      
      // Save to public API directory
      await this._saveToPublicApi(result.combined);
      
      console.log(`Successfully refreshed ${result.combined.length} combined events`);
      return result;
    } catch (error) {
      console.error('Error refreshing all odds data:', error.message);
      return {
        live: [],
        preMatch: [],
        combined: []
      };
    }
  }
  
  /**
   * Save data to public API directory for frontend access
   * @param {Array} data The data to save
   * @param {boolean} isLive Whether this is live data
   */
  async _saveToPublicApi(data, isLive = false) {
    try {
      const filename = isLive ? 'live-odds-data.json' : 'odds-data.json';
      const filePath = path.join(this.publicApiDir, filename);
      
      await fs.writeFile(filePath, JSON.stringify(data), 'utf-8');
      console.log(`Saved ${data.length} events to ${filename}`);
    } catch (error) {
      console.error(`Error saving to public API directory:`, error.message);
    }
  }
}

export default RealOddsApiManager; 