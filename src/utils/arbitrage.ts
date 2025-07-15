export interface ArbitrageOpportunity {
  id: string
  matchName: string
  teamHome: string
  teamAway: string
  league: string
  matchTime: string
  marketType: string
  bookmakers: {
    bookmaker: string
    outcome: 'home' | 'away' | 'draw'
    odds: number
  }[]
  arbitragePercentage: number
  profitPercentage: number
  stakes: {
    bookmaker: string
    outcome: string
    stake: number
    potentialReturn: number
  }[]
  totalStake: number
  guaranteedProfit: number
  lastUpdated: string
}

export interface MatchOdds {
  id: string
  match_id: string
  bookmaker: string
  match_name: string
  team_home: string
  team_away: string
  league: string
  match_time: string
  market_type: string
  odds_home: number
  odds_away: number
  odds_draw?: number
  updated_at: string
}

export const calculateArbitrage = (odds: MatchOdds[], userStake: number = 10000): ArbitrageOpportunity[] => {
  const opportunities: ArbitrageOpportunity[] = []
  
  // Group odds by match_id
  const matchGroups = odds.reduce((groups, odd) => {
    if (!groups[odd.match_id]) {
      groups[odd.match_id] = []
    }
    groups[odd.match_id].push(odd)
    return groups
  }, {} as Record<string, MatchOdds[]>)

  // Check each match for arbitrage opportunities
  Object.entries(matchGroups).forEach(([matchId, matchOdds]) => {
    if (matchOdds.length < 2) return // Need at least 2 bookmakers

    // For each outcome (home, away, draw), find the best odds
    const bestOdds = {
      home: matchOdds.reduce((best, current) => 
        current.odds_home > best.odds_home ? current : best
      ),
      away: matchOdds.reduce((best, current) => 
        current.odds_away > best.odds_away ? current : best
      ),
      draw: matchOdds.reduce((best, current) => 
        (current.odds_draw || 0) > (best.odds_draw || 0) ? current : best
      )
    }

    // Check for arbitrage in 2-way markets (home vs away)
    const arbitrageValue2Way = (1 / bestOdds.home.odds_home) + (1 / bestOdds.away.odds_away)
    
    if (arbitrageValue2Way < 1) {
      const profitPercentage = ((1 - arbitrageValue2Way) / arbitrageValue2Way) * 100
      
      // Calculate stakes
      const homeStake = userStake / (bestOdds.home.odds_home * arbitrageValue2Way)
      const awayStake = userStake / (bestOdds.away.odds_away * arbitrageValue2Way)
      
      const totalCalculatedStake = homeStake + awayStake
      const guaranteedProfit = userStake - totalCalculatedStake

      opportunities.push({
        id: `${matchId}-2way`,
        matchName: matchOdds[0].match_name,
        teamHome: matchOdds[0].team_home,
        teamAway: matchOdds[0].team_away,
        league: matchOdds[0].league,
        matchTime: matchOdds[0].match_time,
        marketType: '1X2',
        bookmakers: [
          {
            bookmaker: bestOdds.home.bookmaker,
            outcome: 'home',
            odds: bestOdds.home.odds_home
          },
          {
            bookmaker: bestOdds.away.bookmaker,
            outcome: 'away',
            odds: bestOdds.away.odds_away
          }
        ],
        arbitragePercentage: arbitrageValue2Way * 100,
        profitPercentage,
        stakes: [
          {
            bookmaker: bestOdds.home.bookmaker,
            outcome: `${matchOdds[0].team_home} Win`,
            stake: Math.round(homeStake),
            potentialReturn: Math.round(homeStake * bestOdds.home.odds_home)
          },
          {
            bookmaker: bestOdds.away.bookmaker,
            outcome: `${matchOdds[0].team_away} Win`,
            stake: Math.round(awayStake),
            potentialReturn: Math.round(awayStake * bestOdds.away.odds_away)
          }
        ],
        totalStake: Math.round(totalCalculatedStake),
        guaranteedProfit: Math.round(guaranteedProfit),
        lastUpdated: new Date().toISOString()
      })
    }

    // Check for arbitrage in 3-way markets (home vs away vs draw) if draw odds exist
    if (bestOdds.draw.odds_draw && bestOdds.draw.odds_draw > 1) {
      const arbitrageValue3Way = (1 / bestOdds.home.odds_home) + 
                               (1 / bestOdds.away.odds_away) + 
                               (1 / bestOdds.draw.odds_draw)
      
      if (arbitrageValue3Way < 1) {
        const profitPercentage = ((1 - arbitrageValue3Way) / arbitrageValue3Way) * 100
        
        // Calculate stakes for 3-way
        const homeStake = userStake / (bestOdds.home.odds_home * arbitrageValue3Way)
        const awayStake = userStake / (bestOdds.away.odds_away * arbitrageValue3Way)
        const drawStake = userStake / (bestOdds.draw.odds_draw * arbitrageValue3Way)
        
        const totalCalculatedStake = homeStake + awayStake + drawStake
        const guaranteedProfit = userStake - totalCalculatedStake

        opportunities.push({
          id: `${matchId}-3way`,
          matchName: matchOdds[0].match_name,
          teamHome: matchOdds[0].team_home,
          teamAway: matchOdds[0].team_away,
          league: matchOdds[0].league,
          matchTime: matchOdds[0].match_time,
          marketType: '1X2',
          bookmakers: [
            {
              bookmaker: bestOdds.home.bookmaker,
              outcome: 'home',
              odds: bestOdds.home.odds_home
            },
            {
              bookmaker: bestOdds.away.bookmaker,
              outcome: 'away',
              odds: bestOdds.away.odds_away
            },
            {
              bookmaker: bestOdds.draw.bookmaker,
              outcome: 'draw',
              odds: bestOdds.draw.odds_draw
            }
          ],
          arbitragePercentage: arbitrageValue3Way * 100,
          profitPercentage,
          stakes: [
            {
              bookmaker: bestOdds.home.bookmaker,
              outcome: `${matchOdds[0].team_home} Win`,
              stake: Math.round(homeStake),
              potentialReturn: Math.round(homeStake * bestOdds.home.odds_home)
            },
            {
              bookmaker: bestOdds.away.bookmaker,
              outcome: `${matchOdds[0].team_away} Win`,
              stake: Math.round(awayStake),
              potentialReturn: Math.round(awayStake * bestOdds.away.odds_away)
            },
            {
              bookmaker: bestOdds.draw.bookmaker,
              outcome: 'Draw',
              stake: Math.round(drawStake),
              potentialReturn: Math.round(drawStake * bestOdds.draw.odds_draw)
            }
          ],
          totalStake: Math.round(totalCalculatedStake),
          guaranteedProfit: Math.round(guaranteedProfit),
          lastUpdated: new Date().toISOString()
        })
      }
    }
  })

  // Sort by profit percentage (highest first)
  return opportunities.sort((a, b) => b.profitPercentage - a.profitPercentage)
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export const getTimeAgo = (dateString: string): string => {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  
  if (diffSeconds < 60) return `${diffSeconds}s ago`
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  
  return date.toLocaleDateString()
}