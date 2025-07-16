import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useUserPreferences } from '@/contexts/UserPreferencesContext'

const bookmakers = [
  { id: 'bet9ja', name: 'Bet9ja', color: 'bg-green-600' },
  { id: '1xbet', name: '1xBet', color: 'bg-blue-600' },
  { id: 'betano', name: 'Betano', color: 'bg-orange-600' },
  { id: 'betking', name: 'BetKing', color: 'bg-purple-600' },
  { id: 'sportybet', name: 'SportyBet', color: 'bg-red-600' },
]

export const BookmakerSelection = () => {
  const { preferences, updateSelectedBookmakers } = useUserPreferences()
  const [selectedBookmakers, setSelectedBookmakers] = useState<string[]>(preferences.selectedBookmakers)
  const { toast } = useToast()

  const handleBookmakerToggle = (bookmakerId: string) => {
    setSelectedBookmakers(prev => {
      if (prev.includes(bookmakerId)) {
        return prev.filter(id => id !== bookmakerId)
      } else {
        return [...prev, bookmakerId]
      }
    })
  }

  const handleSave = () => {
    if (selectedBookmakers.length === 0) {
      toast({
        title: "No Bookmakers Selected",
        description: "Please select at least one bookmaker to monitor.",
        variant: "destructive"
      })
      return
    }

    updateSelectedBookmakers(selectedBookmakers)
    toast({
      title: "Bookmakers Updated",
      description: `Monitoring ${selectedBookmakers.length} bookmaker${selectedBookmakers.length > 1 ? 's' : ''} for arbitrage opportunities.`
    })
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">Select Bookmakers</h1>
          <p className="text-muted-foreground">
            Choose which bookmakers to monitor for arbitrage opportunities
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Available Bookmakers</span>
              <Badge variant="secondary">
                {selectedBookmakers.length} of {bookmakers.length} selected
              </Badge>
            </CardTitle>
            <CardDescription>
              Select at least 2 bookmakers to find arbitrage opportunities between them
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {bookmakers.map((bookmaker) => (
              <div
                key={bookmaker.id}
                className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  id={bookmaker.id}
                  checked={selectedBookmakers.includes(bookmaker.id)}
                  onCheckedChange={() => handleBookmakerToggle(bookmaker.id)}
                />
                <div className="flex items-center space-x-3 flex-1">
                  <div className={`w-4 h-4 rounded-full ${bookmaker.color}`} />
                  <label
                    htmlFor={bookmaker.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {bookmaker.name}
                  </label>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {selectedBookmakers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Selected Bookmakers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {selectedBookmakers.map((id) => {
                  const bookmaker = bookmakers.find(b => b.id === id)
                  return (
                    <Badge key={id} variant="secondary" className="px-3 py-1">
                      {bookmaker?.name}
                    </Badge>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Button 
          onClick={handleSave} 
          className="w-full"
          disabled={selectedBookmakers.length === 0}
        >
          Save Selection
        </Button>
      </div>
    </div>
  )
}