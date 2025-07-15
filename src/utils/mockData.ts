import { MatchOdds } from './arbitrage'

// Generate realistic mock odds for Nigerian football leagues and international matches
export const generateMockOdds = (): MatchOdds[] => {
  const bookmakers = ['bet9ja', '1xbet', 'betano', 'betking', 'sportybet']
  
  const matches = [
    {
      match_id: 'epl_001',
      match_name: 'Arsenal vs Chelsea',
      team_home: 'Arsenal',
      team_away: 'Chelsea',
      league: 'Premier League',
      match_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    },
    {
      match_id: 'epl_002', 
      match_name: 'Manchester United vs Liverpool',
      team_home: 'Manchester United',
      team_away: 'Liverpool',
      league: 'Premier League',
      match_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      match_id: 'npfl_001',
      match_name: 'Rivers United vs Enyimba',
      team_home: 'Rivers United',
      team_away: 'Enyimba',
      league: 'NPFL',
      match_time: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      match_id: 'laliga_001',
      match_name: 'Real Madrid vs Barcelona',
      team_home: 'Real Madrid',
      team_away: 'Barcelona',
      league: 'La Liga',
      match_time: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      match_id: 'ucl_001',
      match_name: 'Bayern Munich vs PSG',
      team_home: 'Bayern Munich',
      team_away: 'PSG',
      league: 'Champions League',
      match_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ]

  const mockOdds: MatchOdds[] = []

  matches.forEach(match => {
    bookmakers.forEach(bookmaker => {
      // Generate slightly different odds for each bookmaker to create arbitrage opportunities
      const baseHomeOdds = 1.8 + Math.random() * 1.4 // 1.8 - 3.2
      const baseAwayOdds = 1.8 + Math.random() * 1.4
      const baseDrawOdds = 3.0 + Math.random() * 1.5 // 3.0 - 4.5

      // Add bookmaker-specific variance to create arbitrage opportunities
      const variance = (Math.random() - 0.5) * 0.3 // -0.15 to +0.15
      
      mockOdds.push({
        id: `${match.match_id}_${bookmaker}`,
        match_id: match.match_id,
        bookmaker,
        match_name: match.match_name,
        team_home: match.team_home,
        team_away: match.team_away,
        league: match.league,
        match_time: match.match_time,
        market_type: '1X2',
        odds_home: Number((baseHomeOdds + variance).toFixed(2)),
        odds_away: Number((baseAwayOdds - variance).toFixed(2)),
        odds_draw: Number((baseDrawOdds + (variance * 0.5)).toFixed(2)),
        updated_at: new Date().toISOString()
      })
    })
  })

  // Manually create some guaranteed arbitrage opportunities
  const arbMatch = {
    match_id: 'arb_special_001',
    match_name: 'Tottenham vs Newcastle',
    team_home: 'Tottenham',
    team_away: 'Newcastle', 
    league: 'Premier League',
    match_time: new Date(Date.now() + 1.5 * 24 * 60 * 60 * 1000).toISOString(),
  }

  // Create guaranteed arbitrage by making sure 1/odds1 + 1/odds2 < 1
  mockOdds.push(
    {
      id: `${arbMatch.match_id}_bet9ja`,
      match_id: arbMatch.match_id,
      bookmaker: 'bet9ja',
      match_name: arbMatch.match_name,
      team_home: arbMatch.team_home,
      team_away: arbMatch.team_away,
      league: arbMatch.league,
      match_time: arbMatch.match_time,
      market_type: '1X2',
      odds_home: 2.10, // 1/2.10 = 0.476
      odds_away: 1.95,
      odds_draw: 3.40,
      updated_at: new Date().toISOString()
    },
    {
      id: `${arbMatch.match_id}_1xbet`,
      match_id: arbMatch.match_id,
      bookmaker: '1xbet',
      match_name: arbMatch.match_name,
      team_home: arbMatch.team_home,
      team_away: arbMatch.team_away,
      league: arbMatch.league,
      match_time: arbMatch.match_time,
      market_type: '1X2',
      odds_home: 1.85,
      odds_away: 2.15, // 1/2.15 = 0.465
      odds_draw: 3.30,
      updated_at: new Date().toISOString()
    }
    // Total: 0.476 + 0.465 = 0.941 < 1.0 = ARBITRAGE OPPORTUNITY!
  )

  return mockOdds
}

// Function to seed the database with mock data
export const seedMockOdds = async () => {
  try {
    const { supabase } = await import('@/lib/supabase')
    
    // Clear existing odds
    await supabase.from('bookmaker_odds').delete().gte('id', '0')
    
    // Insert mock odds
    const mockOdds = generateMockOdds()
    const { error } = await supabase.from('bookmaker_odds').insert(mockOdds)
    
    if (error) {
      console.error('Error seeding mock odds:', error)
      return false
    }
    
    console.log(`Successfully seeded ${mockOdds.length} mock odds`)
    return true
  } catch (error) {
    console.error('Error in seedMockOdds:', error)
    return false
  }
}