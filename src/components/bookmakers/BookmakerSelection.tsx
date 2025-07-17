import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useUserPreferences } from '@/contexts/UserPreferencesContext'
import { useData } from '@/contexts/DataContext'
import { Search } from 'lucide-react'

// Expanded bookmaker list with proper branding colors
const bookmakers = [
  { id: 'bet9ja', name: 'Bet9ja', color: 'bg-green-600', region: 'nigeria' },
  { id: '1xbet', name: '1xBet', color: 'bg-blue-600', region: 'international' },
  { id: 'betking', name: 'BetKing', color: 'bg-purple-600', region: 'nigeria' },
  { id: 'sportybet', name: 'SportyBet', color: 'bg-red-600', region: 'nigeria' },
  { id: 'nairabet', name: 'NairaBet', color: 'bg-yellow-600', region: 'nigeria' },
  { id: 'merrybet', name: 'MerryBet', color: 'bg-orange-600', region: 'nigeria' },
  { id: 'betway', name: 'BetWay', color: 'bg-black', region: 'international' },
  { id: 'bangbet', name: 'BangBet', color: 'bg-pink-600', region: 'nigeria' },
  { id: 'accessbet', name: 'AccessBet', color: 'bg-emerald-600', region: 'nigeria' },
  { id: 'betwinner', name: 'BetWinner', color: 'bg-cyan-600', region: 'international' },
  { id: 'betano', name: 'Betano', color: 'bg-teal-600', region: 'international' },
  { id: 'superbet', name: 'SuperBet', color: 'bg-rose-600', region: 'nigeria' },
  { id: 'parimatch', name: 'Parimatch', color: 'bg-amber-600', region: 'international' },
  { id: 'livescore', name: 'LiveScore Bet', color: 'bg-indigo-600', region: 'international' },
  { id: 'msport', name: 'MSport', color: 'bg-lime-600', region: 'nigeria' },
]

export const BookmakerSelection = () => {
  const { preferences, updateSelectedBookmakers } = useUserPreferences()
  const { refreshOdds, isRefreshing } = useData()
  const [selectedBookmakers, setSelectedBookmakers] = useState<string[]>(preferences.selectedBookmakers)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  // Initialize with at least two bookmakers selected for demo purposes
  useEffect(() => {
    if (selectedBookmakers.length === 0) {
      setSelectedBookmakers(['Bet9ja', '1xBet']);
    }
  }, []);

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

    // Prevent multiple saves in quick succession
    if (isSaving || isRefreshing) {
      return
    }

    setIsSaving(true)

    // Map bookmaker IDs to their actual names for the API
    const bookmakerNames = selectedBookmakers.map(id => {
      const bookmaker = bookmakers.find(b => b.id === id)
      return bookmaker ? bookmaker.name : id
    })

    // Update preferences with selected bookmaker names
    updateSelectedBookmakers(bookmakerNames)

    // Don't immediately refresh - let the OpportunitiesView handle this
    // when it detects the preference change
    
    toast({
      title: "Bookmakers Updated",
      description: `Monitoring ${selectedBookmakers.length} bookmaker${selectedBookmakers.length > 1 ? 's' : ''} for arbitrage opportunities.`
    })

    setTimeout(() => {
      setIsSaving(false)
    }, 1000)
  }

  const handleSelectAll = () => {
    setSelectedBookmakers(bookmakers.map(bk => bk.id))
  }

  const handleClearAll = () => {
    setSelectedBookmakers([])
  }

  // Filter bookmakers based on search term and active tab
  const filteredBookmakers = bookmakers.filter(bookmaker => {
    const matchesSearch = bookmaker.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTab = activeTab === 'all' || bookmaker.region === activeTab
    return matchesSearch && matchesTab
  })

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
            
            {/* Search input */}
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bookmakers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="px-6">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="nigeria">Nigerian</TabsTrigger>
              <TabsTrigger value="international">International</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredBookmakers.map((bookmaker) => (
                <div
                  key={bookmaker.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                    selectedBookmakers.includes(bookmaker.id) 
                      ? 'bg-primary/5 border-primary/30'
                      : 'hover:bg-muted/50'
                  }`}
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
            </div>

            {filteredBookmakers.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                No bookmakers found matching your search.
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between border-t pt-4">
            <div className="space-x-2">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearAll}>
                Clear All
              </Button>
            </div>
            <Button 
              onClick={handleSave} 
              disabled={selectedBookmakers.length === 0 || isSaving || isRefreshing}
            >
              {isSaving ? "Saving..." : "Save Selection"}
            </Button>
          </CardFooter>
        </Card>

        {selectedBookmakers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Selected Bookmakers ({selectedBookmakers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {selectedBookmakers.map((id) => {
                  const bookmaker = bookmakers.find(b => b.id === id)
                  if (!bookmaker) return null;
                  return (
                    <Badge 
                      key={id} 
                      variant="secondary" 
                      className={`px-3 py-1 ${bookmaker.color.replace('bg-', 'bg-opacity-20 text-')} border-${bookmaker.color.split('-')[1]}-400/30`}
                    >
                      {bookmaker.name}
                      <span 
                        className="ml-2 cursor-pointer" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleBookmakerToggle(id);
                        }}
                      >
                        ×
                      </span>
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
          size="lg"
          disabled={selectedBookmakers.length === 0 || isSaving || isRefreshing}
        >
          {isSaving 
            ? "Saving..." 
            : selectedBookmakers.length > 0 
              ? `Save & Monitor ${selectedBookmakers.length} Bookmakers` 
              : 'Please Select Bookmakers'}
        </Button>
      </div>
    </div>
  )
}