import { memo } from 'react'
import { Home, Settings, BookOpen, Shield, Bell, Zap, Activity } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { NotificationCenter } from './NotificationCenter'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Watermark } from '@/components/ui/watermark'

interface BottomNavbarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

// Optimized navigation items with minimal data
const baseNavItems = [
  {
    name: 'opportunities',
    label: 'Markets',
    icon: Zap,
    color: 'text-blue-400'
  },
  {
    name: 'bookmakers',
    label: 'Bookies',
    icon: BookOpen,
    color: 'text-purple-400'
  },
  {
    name: 'settings',
    label: 'Settings',
    icon: Settings,
    color: 'text-green-400'
  }
]

const adminNavItem = {
  name: 'admin',
  label: 'Admin',
  icon: Shield,
  color: 'text-red-400'
}

const BottomNavbarComponent = ({ activeTab, onTabChange }: BottomNavbarProps) => {
  const { user, isAdmin } = useAuth()
  
  const navItems = isAdmin ? [...baseNavItems, adminNavItem] : baseNavItems

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-2">
      <div className="glass mx-auto max-w-sm rounded-2xl px-2 py-2 backdrop-blur-md">
        <div className="flex items-center justify-around">
          <TooltipProvider delayDuration={500}>
            {navItems.map((item) => {
              const IconComponent = item.icon
              const isActive = activeTab === item.name
              
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onTabChange(item.name)}
                      className={`group relative flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition-all duration-200 ${
                        isActive
                          ? `${item.color} scale-105`
                          : 'text-muted-foreground hover:text-foreground hover:scale-105'
                      }`}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <div className="absolute -top-1 h-1 w-6 rounded-full bg-current opacity-80" />
                      )}
                      
                      <IconComponent className="h-5 w-5" />
                      <span className="text-xs font-medium">{item.label}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="glass">
                    <p className="text-xs">{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              )
            })}
            
            {/* Compact NotificationCenter */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-muted-foreground transition-colors duration-200 hover:text-foreground">
                  <NotificationCenter />
                  <span className="text-xs font-medium">Alerts</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="glass">
                <p className="text-xs">Notifications</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* Developer watermark in navbar */}
        <div className="mt-2 pt-2 border-t border-border/30">
          <Watermark position="relative" className="justify-center" variant="minimal" />
        </div>
      </div>
    </div>
  )
}

export const BottomNavbar = memo(BottomNavbarComponent);