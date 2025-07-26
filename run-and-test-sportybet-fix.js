import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to run the direct-sportybet-scraper.js
async function runSportybetScraper() {
  console.log('Running SportyBet scraper...');
  
  return new Promise((resolve, reject) => {
    const process = exec('node direct-sportybet-scraper.js', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error running scraper: ${error.message}`);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.error(`Stderr: ${stderr}`);
      }
      
      console.log(stdout);
      resolve();
    });
    
    process.stdout.on('data', (data) => {
      console.log(`${data.toString()}`);
    });
  });
}

// Function to find the most recent SportyBet matches file
function findMostRecentMatchesFile() {
  const outputDir = path.join(__dirname, 'output');
  const files = fs.readdirSync(outputDir)
    .filter(file => file.startsWith('sportybet-matches-') && file.endsWith('.json'))
    .map(file => ({
      name: file,
      path: path.join(outputDir, file),
      time: fs.statSync(path.join(outputDir, file)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);
    
  return files.length > 0 ? files[0].path : null;
}

// Function to validate the match data
function validateMatchData(matchFile) {
  console.log(`Validating match data from ${matchFile}...`);
  
  // Read the JSON file
  const matchData = JSON.parse(fs.readFileSync(matchFile, 'utf8'));
  
  console.log(`Found ${matchData.length} matches.`);
  
  // Check for ID prefixes
  const idPrefixMatches = matchData.filter(match => 
    match.home_team.includes('ID:') || 
    match.away_team.includes('ID:') || 
    match.match_name.includes('ID:'));
    
  console.log(`Matches with ID prefixes: ${idPrefixMatches.length}`);
  
  // Check for duplicate team names (home == away)
  const duplicateTeams = matchData.filter(match => 
    match.home_team === match.away_team);
    
  console.log(`Matches with duplicate teams: ${duplicateTeams.length}`);
  
  // Check for year in match time
  const missingYear = matchData.filter(match => 
    !match.match_time.toString().match(/\b20\d{2}\b/));
    
  console.log(`Matches missing year in match_time: ${missingYear.length}`);
  
  // Print sample of matches
  console.log('\n--- Sample Matches ---');
  for (let i = 0; i < Math.min(5, matchData.length); i++) {
    const match = matchData[i];
    console.log(`Match ${i+1}:`);
    console.log(`  Match Name: ${match.match_name}`);
    console.log(`  Home Team: ${match.home_team}`);
    console.log(`  Away Team: ${match.away_team}`);
    console.log(`  League: ${match.league}`);
    console.log(`  Match Time: ${match.match_time}`);
    console.log(`  Odds: ${match.odds_home} | ${match.odds_draw} | ${match.odds_away}`);
    console.log(`  Updated At: ${match.updated_at}`);
    console.log('-------------------');
  }
}

// Main function
async function main() {
  try {
    // Run the scraper
    await runSportybetScraper();
    
    // Find the most recent match file
    const recentMatchFile = findMostRecentMatchesFile();
    
    if (recentMatchFile) {
      // Validate the match data
      validateMatchData(recentMatchFile);
    } else {
      console.error('No match file found.');
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

// Run the main function
main().catch(console.error); 