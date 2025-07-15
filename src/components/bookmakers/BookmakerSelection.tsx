import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

const BOOKMAKERS = [
  { id: 'bet9ja', name: 'Bet9ja', color: 'bg-green-500' },
  { id: '1xbet', name: '1xBet', color: 'bg-blue-500' },
  { id: 'betano', name: 'Betano', color: 'bg-orange-500' },
  { id: 'betking', name: 'BetKing', color: 'bg-red-500' },
  { id: 'sportybet', name: 'SportyBet', color: 'bg-purple-500' },
]

export const BookmakerSelection = () => {
  const [selectedBookmakers, setSelectedBookmakers] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    loadUserPreferences()
  }, [user])

  const loadUserPreferences = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('selected_bookmakers')
        .eq('user_id', user.id)
        .single()

      if (data && !error) {
        setSelectedBookmakers(data.selected_bookmakers || [])
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBookmakerToggle = (bookmakerId: string) => {
    setSelectedBookmakers(prev => {
      if (prev.includes(bookmakerId)) {
        return prev.filter(id => id !== bookmakerId)
      } else {
        return [...prev, bookmakerId]
      }
    })
  }

  const savePreferences = async () => {
    if (!user || selectedBookmakers.length === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least one bookmaker",
        variant: "destructive"
      })
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          selected_bookmakers: selectedBookmakers,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      toast({
        title: "Preferences Saved",
        description: `Selected ${selectedBookmakers.length} bookmaker(s)`
      })
    } catch (error) {
      console.error('Error saving preferences:', error)
      toast({
        title: "Save Failed",
        description: "Failed to save your preferences",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 pb-20">
      <Card>
        <CardHeader>
          <CardTitle>Select Bookmakers</CardTitle>
          <CardDescription>
            Choose which bookmakers to monitor for arbitrage opportunities (1-5)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {BOOKMAKERS.map((bookmaker) => (
            <div
              key={bookmaker.id}
              className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
            >
              <div className={`w-4 h-4 rounded-full ${bookmaker.color}`} />
              <div className="flex-1">
                <label htmlFor={bookmaker.id} className="text-sm font-medium cursor-pointer">
                  {bookmaker.name}
                </label>
              </div>
              <Checkbox
                id={bookmaker.id}
                checked={selectedBookmakers.includes(bookmaker.id)}
                onCheckedChange={() => handleBookmakerToggle(bookmaker.id)}
              />
            </div>
          ))}
          
          <div className="pt-4">
            <Button 
              onClick={savePreferences}
              disabled={saving || selectedBookmakers.length === 0}
              className="w-full"
            >
              {saving ? 'Saving...' : `Save Selection (${selectedBookmakers.length})`}
            </Button>
          </div>

          {selectedBookmakers.length > 0 && (
            <div className="text-sm text-muted-foreground text-center">
              You will see arbitrage opportunities from {selectedBookmakers.length} bookmaker(s)
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}