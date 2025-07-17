import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { User, Bell, DollarSign, Save, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { useUserPreferences } from '@/contexts/UserPreferencesContext'

export const SettingsView = () => {
  const [defaultStake, setDefaultStake] = useState(10000)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { user, signOut } = useAuth()
  const { enableNotifications, requestPermission } = useNotifications()
  const { preferences, updatePreferences } = useUserPreferences()
  const { toast } = useToast()

  // Load settings from user preferences and database
  useEffect(() => {
    // First load from user preferences (local storage)
    if (preferences.defaultStake) {
      setDefaultStake(preferences.defaultStake)
    }
    
    // Then load from database if user is logged in
    if (user) {
      loadDatabaseSettings()
    } else {
      setLoading(false)
    }
  }, [user, preferences])

  const loadDatabaseSettings = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('default_stake, sms_notifications, phone_number')
        .eq('user_id', user.id)
        .single()

      if (data && !error) {
        // Only update if values exist in database
        if (data.default_stake) setDefaultStake(data.default_stake)
        setSmsNotifications(data.sms_notifications || false)
        setPhoneNumber(data.phone_number || '')
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  // Memoize save function to prevent unnecessary re-renders
  const saveSettings = useCallback(async () => {
    setSaving(true)
    
    try {
      // Update local storage first (works even without login)
      updatePreferences({
        ...preferences,
        defaultStake: defaultStake
      })
      
      // Then update database if user is logged in
      if (user) {
        const { error } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            default_stake: defaultStake,
            sms_notifications: smsNotifications,
            phone_number: phoneNumber,
            updated_at: new Date().toISOString()
          })
  
        if (error) throw error
      }

      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated"
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: "Save Failed",
        description: "Failed to save your settings",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }, [defaultStake, smsNotifications, phoneNumber, user, updatePreferences, preferences, toast])

  // Handle stake input with validation
  const handleStakeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    if (!isNaN(value) && value >= 0) {
      setDefaultStake(value)
    }
  }

  // Handle phone number input with validation
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only digits, +, spaces, and parentheses
    const value = e.target.value.replace(/[^\d\s+()]/g, '')
    setPhoneNumber(value)
  }

  if (loading) {
    return (
      <div className="p-4 pb-20">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading settings...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 pb-20 space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input value={user?.email || 'Not logged in'} disabled className="mt-1" />
          </div>
          <div>
            <Label>Account Type</Label>
            <Input value={user ? "Standard User" : "Guest"} disabled className="mt-1" />
          </div>
        </CardContent>
      </Card>

      {/* Trading Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Trading Preferences
          </CardTitle>
          <CardDescription>
            Set your default trading parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="default-stake">Default Stake Amount (₦)</Label>
            <Input
              id="default-stake"
              type="number"
              value={defaultStake}
              onChange={handleStakeChange}
              min="1000"
              step="1000"
              className="mt-1"
            />
            <p className="text-sm text-muted-foreground mt-1">
              This will be your default stake for arbitrage calculations
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Manage how you receive alerts about new opportunities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Browser Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get instant alerts for new arbitrage opportunities
              </p>
            </div>
            {!enableNotifications ? (
              <Button size="sm" onClick={requestPermission}>
                Enable
              </Button>
            ) : (
              <span className="text-sm text-green-600">Enabled</span>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive SMS alerts for new arbitrage opportunities
              </p>
            </div>
            <Switch
              checked={smsNotifications}
              onCheckedChange={setSmsNotifications}
              disabled={!user}
            />
          </div>
          
          {smsNotifications && (
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+234 XXX XXX XXXX"
                value={phoneNumber}
                onChange={handlePhoneChange}
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Include country code (e.g., +234 for Nigeria)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button onClick={saveSettings} disabled={saving} className="w-full">
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </>
        )}
      </Button>

      {/* Sign Out */}
      {user && (
        <Button variant="outline" onClick={signOut} className="w-full">
          Sign Out
        </Button>
      )}
    </div>
  )
}