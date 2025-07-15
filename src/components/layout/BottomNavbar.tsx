import { Home, Settings, Building2, LogOut, Users } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'

interface BottomNavbarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export const BottomNavbar = ({ activeTab, onTabChange }: BottomNavbarProps) => {
  const { signOut, isAdmin } = useAuth()

  const tabs = [
    { id: 'opportunities', label: 'Home', icon: Home },
    { id: 'bookmakers', label: 'Bookies', icon: Building2 },
    { id: 'settings', label: 'Settings', icon: Settings },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: Users }] : []),
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex items-center justify-around p-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              size="sm"
              className="flex flex-col items-center gap-1 h-auto py-2 px-3"
              onClick={() => onTabChange(tab.id)}
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs">{tab.label}</span>
            </Button>
          )
        })}
        <Button
          variant="ghost"
          size="sm"
          className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-destructive"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          <span className="text-xs">Logout</span>
        </Button>
      </div>
    </div>
  )
}