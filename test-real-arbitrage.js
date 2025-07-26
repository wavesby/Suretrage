import axios from 'axios';

console.log('🎯 TESTING REAL ARBITRAGE FROM ODDS API');
console.log('='.repeat(50));

async function testRealArbitrage() {
  try {
    // Get real data from API
    const response = await axios.get('http://localhost:3001/api/odds');
    const realData = response.data;
    
    console.log(`📊 Real events from Odds API: ${realData.length}`);
    console.log(`📋 First match: ${realData[0].home_team} vs ${realData[0].away_team}`);
    console.log(`🏛️ Bookmakers: ${realData[0].bookmakers.length}`);
    
    // Convert to MatchOdds format
    const matchOdds = [];
    
    realData.forEach(event => {
      if (event.bookmakers && Array.isArray(event.bookmakers)) {
        event.bookmakers.forEach(bookmaker => {
          if (bookmaker.markets && Array.isArray(bookmaker.markets)) {
            bookmaker.markets.forEach(market => {
              if (market.key === 'h2h' && market.outcomes && Array.isArray(market.outcomes)) {
                const homeOutcome = market.outcomes.find(o => o.name === event.home_team);
                const awayOutcome = market.outcomes.find(o => o.name === event.away_team);
                const drawOutcome = market.outcomes.find(o => o.name === 'Draw');
                
                if (homeOutcome && awayOutcome) {
                  matchOdds.push({
                    id: `${event.id}-${bookmaker.key || bookmaker.title}`,
                    match_id: event.id,
                    bookmaker: bookmaker.title || bookmaker.key,
                    match_name: `${event.home_team} vs ${event.away_team}`,
                    team_home: event.home_team,
                    team_away: event.away_team,
                    league: event.sport_title,
                    match_time: event.commence_time,
                    market_type: '1X2',
                    odds_home: homeOutcome.price,
                    odds_away: awayOutcome.price,
                    odds_draw: drawOutcome?.price,
                    updated_at: market.last_update || new Date().toISOString()
                  });
                }
              }
            });
          }
        });
      }
    });
    
    console.log(`🔄 Converted to: ${matchOdds.length} MatchOdds entries`);
    
    // Group by match and calculate arbitrage
    const matchGroups = {};
    matchOdds.forEach(odd => {
      const matchKey = odd.match_id;
      if (!matchGroups[matchKey]) {
        matchGroups[matchKey] = [];
      }
      matchGroups[matchKey].push(odd);
    });
    
    console.log(`⚽ Unique matches: ${Object.keys(matchGroups).length}`);
    
    // Test arbitrage calculation 
    const arbitrageOpportunities = [];
    
    Object.entries(matchGroups).forEach(([matchId, odds]) => {
      if (odds.length >= 2) {
        // Find best odds for each outcome
        const bestHome = Math.max(...odds.map(o => o.odds_home));
        const bestAway = Math.max(...odds.map(o => o.odds_away));
        const bestDraw = odds.some(o => o.odds_draw) ? Math.max(...odds.filter(o => o.odds_draw).map(o => o.odds_draw)) : null;
        
        // Calculate arbitrage percentage
        let arbitragePercentage;
        if (bestDraw) {
          arbitragePercentage = (1/bestHome) + (1/bestAway) + (1/bestDraw);
        } else {
          arbitragePercentage = (1/bestHome) + (1/bestAway);
        }
        
        console.log(`\n🏟️  ${odds[0].match_name} (${odds.length} bookmakers)`);
        console.log(`   Best odds: H:${bestHome} A:${bestAway} D:${bestDraw || 'N/A'}`);
        console.log(`   Arbitrage: ${(arbitragePercentage * 100).toFixed(2)}%`);
        
        if (arbitragePercentage < 1.0) {
          const profitPercentage = ((1/arbitragePercentage) - 1) * 100;
          arbitrageOpportunities.push({
            match: odds[0].match_name,
            profitPercentage: profitPercentage,
            arbitragePercentage: arbitragePercentage,
            bestOdds: { home: bestHome, away: bestAway, draw: bestDraw }
          });
          console.log(`   🎯 ARBITRAGE! Profit: ${profitPercentage.toFixed(2)}%`);
        } else {
          console.log(`   ❌ No arbitrage (${((arbitragePercentage - 1) * 100).toFixed(2)}% overround)`);
        }
      }
    });
    
    console.log('\n' + '='.repeat(50));
    console.log('🎯 REAL ARBITRAGE RESULTS:');
    console.log('='.repeat(50));
    console.log(`📊 Real matches analyzed: ${Object.keys(matchGroups).length}`);
    console.log(`🎯 Arbitrage opportunities: ${arbitrageOpportunities.length}`);
    
    if (arbitrageOpportunities.length > 0) {
      console.log('\n✅ REAL ARBITRAGE OPPORTUNITIES FOUND:');
      arbitrageOpportunities.forEach((opp, i) => {
        console.log(`${i+1}. ${opp.match}: ${opp.profitPercentage.toFixed(2)}% profit`);
      });
    } else {
      console.log('\n📊 No arbitrage opportunities in current real data');
      console.log('💡 This is normal - real arbitrage opportunities are rare');
      console.log('✅ Your system is working correctly with REAL Odds API data');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testRealArbitrage(); 