import { memo } from 'react'
import { Home, Settings, BookOpen, User, Shield, Bell } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { NotificationCenter } from './NotificationCenter'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface BottomNavbarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

// Define navigation items outside component to prevent recreation on each render
const baseNavItems = [
  {
    name: 'opportunities',
    label: 'Opportunities',
    icon: <Home className="w-5 h-5" />,
    tooltip: 'View arbitrage opportunities'
  },
  {
    name: 'bookmakers',
    label: 'Bookies',
    icon: <BookOpen className="w-5 h-5" />,
    tooltip: 'Select bookmakers to monitor'
  },
  {
    name: 'settings',
    label: 'Settings',
    icon: <Settings className="w-5 h-5" />,
    tooltip: 'Configure app settings'
  }
]

const adminNavItem = {
  name: 'admin',
  label: 'Admin',
  icon: <Shield className="w-5 h-5" />,
  tooltip: 'Admin panel'
}

const BottomNavbarComponent = ({ activeTab, onTabChange }: BottomNavbarProps) => {
  const { user, isAdmin } = useAuth()
  
  // Dynamically create navigation items based on user role
  const navItems = isAdmin ? [...baseNavItems, adminNavItem] : baseNavItems

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t border-border">
      <div className="grid h-full grid-cols-4 mx-auto font-medium">
        <TooltipProvider>
          {navItems.map((item) => (
            <Tooltip key={item.name} delayDuration={300}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onTabChange(item.name)}
                  className={`inline-flex flex-col items-center justify-center px-5 group ${
                    activeTab === item.name
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-primary/70'
                  }`}
                >
                  {item.icon}
                  <span className="text-xs">{item.label}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{item.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          ))}
          
          {/* NotificationCenter in the last slot */}
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <div className="inline-flex flex-col items-center justify-center px-5">
                <div className="mb-1">
                  <NotificationCenter />
                </div>
                <span className="text-xs text-muted-foreground">Alerts</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Notifications and alerts</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}

// Memoize the component to prevent unnecessary re-renders
export const BottomNavbar = memo(BottomNavbarComponent);