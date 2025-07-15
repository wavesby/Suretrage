import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { RefreshCw, Search, AlertCircle } from 'lucide-react'
import { OpportunityCard } from './OpportunityCard'
import { ArbitrageOpportunity, MatchOdds, calculateArbitrage } from '@/utils/arbitrage'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

export const OpportunitiesView = () => {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [stakeAmount, setStakeAmount] = useState(10000)
  const [searchTerm, setSearchTerm] = useState('')
  const [userBookmakers, setUserBookmakers] = useState<string[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    loadUserPreferences()
    loadOpportunities()
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(loadOpportunities, 30000)
    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    if (userBookmakers.length > 0) {
      loadOpportunities()
    }
  }, [stakeAmount, userBookmakers])

  const loadUserPreferences = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('selected_bookmakers, default_stake')
        .eq('user_id', user.id)
        .single()

      if (data && !error) {
        setUserBookmakers(data.selected_bookmakers || [])
        if (data.default_stake) {
          setStakeAmount(data.default_stake)
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    }
  }

  const loadOpportunities = async () => {
    setLoading(true)
    try {
      // Load all odds
      const { data: odds, error } = await supabase
        .from('bookmaker_odds')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error

      if (odds) {
        // Filter odds to only include user's selected bookmakers if they have any
        const filteredOdds = userBookmakers.length > 0 
          ? odds.filter(odd => userBookmakers.includes(odd.bookmaker))
          : odds

        // Calculate arbitrage opportunities
        const arbOpportunities = calculateArbitrage(filteredOdds as MatchOdds[], stakeAmount)
        setOpportunities(arbOpportunities)
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Error loading opportunities:', error)
      toast({
        title: "Loading Failed",
        description: "Failed to load arbitrage opportunities",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const saveStakePreference = async () => {
    if (!user) return
    
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          default_stake: stakeAmount,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      toast({
        title: "Stake Saved",
        description: `Default stake set to ₦${stakeAmount.toLocaleString()}`
      })
    } catch (error) {
      console.error('Error saving stake:', error)
    }
  }

  const filteredOpportunities = opportunities.filter(opp =>
    opp.matchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opp.teamHome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opp.teamAway.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opp.league.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (userBookmakers.length === 0) {
    return (
      <div className="p-4 pb-20">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              No Bookmakers Selected
            </CardTitle>
            <CardDescription>
              Please select bookmakers from the Bookies tab to see arbitrage opportunities
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 pb-20">
      {/* Header with controls */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Arbitrage Opportunities</h1>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadOpportunities}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stake input */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="stake">Total Stake Amount (₦)</Label>
                <Input
                  id="stake"
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(Number(e.target.value))}
                  min="1000"
                  step="1000"
                  className="mt-1"
                />
              </div>
              <Button onClick={saveStakePreference} size="sm" className="mt-6">
                Save
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search matches, teams, or leagues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredOpportunities.length}
              </div>
              <div className="text-sm text-muted-foreground">Opportunities</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold">
                {userBookmakers.length}
              </div>
              <div className="text-sm text-muted-foreground">Bookmakers</div>
            </CardContent>
          </Card>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      {/* Opportunities list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-48 bg-muted rounded-lg" />
            </div>
          ))}
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Opportunities Found</h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'No arbitrage opportunities available at the moment'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOpportunities.map(opportunity => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </div>
      )}
    </div>
  )
}