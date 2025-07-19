import { MatchOdds } from './arbitrage';

// Utility function to generate a random integer
const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Utility function to generate random odds
const getRandomOdds = (): number => {
  // Generate odds between 1.1 and 5.0 with one decimal place
  return parseFloat((Math.random() * 3.9 + 1.1).toFixed(2));
};

// List of sample teams for generating matches
const teams = [
  "Manchester United", "Arsenal", "Chelsea", "Liverpool", "Manchester City",
  "Tottenham", "Leicester City", "West Ham", "Everton", "Leeds United",
  "Wolves", "Newcastle", "Aston Villa", "Brighton", "Southampton",
  "Real Madrid", "Barcelona", "Atletico Madrid", "Sevilla", "Valencia",
  "Bayern Munich", "Borussia Dortmund", "RB Leipzig", "Bayer Leverkusen", "Wolfsburg",
  "PSG", "Lyon", "Marseille", "Monaco", "Lille",
  "Juventus", "Inter Milan", "AC Milan", "Napoli", "Roma", "Lazio",
  "Ajax", "PSV", "Feyenoord", "AZ Alkmaar", "FC Utrecht"
];

// List of sample leagues
const leagues = [
  "Premier League", "La Liga", "Bundesliga", "Ligue 1", "Serie A",
  "Eredivisie", "Champions League", "Europa League", "FA Cup", "Copa del Rey",
  "Africa Cup of Nations", "World Cup Qualifiers", "MLS", "Copa Libertadores"
];

// List of supported bookmakers
const bookmakers = [
  "Bet9ja", "1xBet", "BetKing", "SportyBet", "NairaBet",
  "Betway", "BangBet", "Parimatch"
];

// Generate random future date within the next 7 days
const getRandomFutureDate = (): string => {
  const now = new Date();
  const futureDate = new Date(now);
  futureDate.setDate(now.getDate() + getRandomInt(0, 7)); // Between today and 7 days in future
  futureDate.setHours(getRandomInt(12, 22), getRandomInt(0, 59), 0, 0); // Match time between 12pm and 10pm
  return futureDate.toISOString();
};

// Generate a set of mock matches with consistent teams
const generateMockMatches = (count: number = 20) => {
  const matches = [];
  const usedTeams = new Set<string>();
  
  for (let i = 0; i < count; i++) {
    // Ensure teams aren't reused in different matches
    let homeTeam, awayTeam;
    do {
      homeTeam = teams[getRandomInt(0, teams.length - 1)];
      awayTeam = teams[getRandomInt(0, teams.length - 1)];
    } while (homeTeam === awayTeam || usedTeams.has(homeTeam) || usedTeams.has(awayTeam));
    
    usedTeams.add(homeTeam);
    usedTeams.add(awayTeam);
    
    const league = leagues[getRandomInt(0, leagues.length - 1)];
    const matchTime = getRandomFutureDate();
    const matchId = `match-${i + 1}-${Date.now()}`;
    
    matches.push({
      id: matchId,
      homeTeam,
      awayTeam,
      league,
      matchTime
    });
  }
  
  return matches;
};

// Generate mock odds data for all bookmakers
export const generateMockOdds = (): MatchOdds[] => {
  const mockMatches = generateMockMatches(15);
  const odds: MatchOdds[] = [];
  
  mockMatches.forEach(match => {
    // For each match, generate odds for each bookmaker
    bookmakers.forEach(bookmaker => {
      // Base odds for the match
      const baseHomeOdds = getRandomOdds();
      const baseDrawOdds = getRandomOdds();
      const baseAwayOdds = getRandomOdds();
      
      // Slightly vary the odds for each bookmaker
      const variation = () => (Math.random() * 0.2 - 0.1);
      
      const odds_home = parseFloat((baseHomeOdds + variation()).toFixed(2));
      const odds_draw = parseFloat((baseDrawOdds + variation()).toFixed(2));
      const odds_away = parseFloat((baseAwayOdds + variation()).toFixed(2));
      
      // Create the odds record
      odds.push({
        id: `${bookmaker.toLowerCase()}-${match.id}`,
        match_id: match.id,
        bookmaker,
        match_name: `${match.homeTeam} vs ${match.awayTeam}`,
        team_home: match.homeTeam,
        team_away: match.awayTeam,
        league: match.league,
        match_time: match.matchTime,
        market_type: '1X2',
        odds_home,
        odds_draw,
        odds_away,
        updated_at: new Date().toISOString(),
        liquidity: getRandomInt(6, 10),
        suspensionRisk: getRandomInt(1, 5)
      });
      
      // Randomly add over/under markets for some matches
      if (Math.random() > 0.5) {
        const goals_over_under = [2.5, 1.5, 3.5][getRandomInt(0, 2)];
        const odds_over = parseFloat((getRandomOdds()).toFixed(2));
        const odds_under = parseFloat((getRandomOdds()).toFixed(2));
        
        odds.push({
          id: `${bookmaker.toLowerCase()}-${match.id}-ou`,
          match_id: match.id,
          bookmaker,
          match_name: `${match.homeTeam} vs ${match.awayTeam}`,
          team_home: match.homeTeam,
          team_away: match.awayTeam,
          league: match.league,
          match_time: match.matchTime,
          market_type: 'OVER_UNDER',
          odds_home: 0, // Not applicable for over/under
          odds_away: 0, // Not applicable for over/under
          goals_over_under,
          odds_over,
          odds_under,
          updated_at: new Date().toISOString(),
          liquidity: getRandomInt(6, 10),
          suspensionRisk: getRandomInt(1, 5)
        });
      }
    });
  });
  
  return odds;
};

// Export pre-generated mock odds for consistency
export const mockOdds = generateMockOdds();

// Generate mock user data
export const generateMockUser = (isAdmin: boolean = false) => {
  return {
    id: `user-${Date.now()}`,
    email: isAdmin ? 'admin@sportarbitrage.com' : `user${getRandomInt(1000, 9999)}@example.com`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    email_confirmed_at: new Date().toISOString(),
    user_metadata: {
      role: isAdmin ? 'admin' : 'user',
      name: isAdmin ? 'Admin User' : `Test User ${getRandomInt(1, 100)}`
    }
  };
};