import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import LoginForm from '@/components/auth/LoginForm'
import { BottomNavbar } from '@/components/layout/BottomNavbar'
import { OpportunitiesView } from '@/components/opportunities/OpportunitiesView'
import { BookmakerSelection } from '@/components/bookmakers/BookmakerSelection'
import { SettingsView } from '@/components/settings/SettingsView'
import { AdminView } from '@/components/admin/AdminView'
import { Zap, BarChart3, Sparkles, Cpu } from 'lucide-react'

const Index = () => {
  const { user, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('opportunities')

  // Optimized loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto p-6">
          <div className="relative mx-auto w-16 h-16 mb-6">
            <Cpu className="w-16 h-16 text-primary animate-spin-slow" />
          </div>
          
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-gradient">ArbiTrader Pro</h1>
            <p className="text-lg text-muted-foreground">Initializing neural networks...</p>
            
            <div className="flex items-center justify-center space-x-1 mt-4">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Enhanced login screen with stunning visuals
  if (!user) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
        
        <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-16 items-center relative z-10">
          {/* Enhanced branding section */}
          <div className="text-center lg:text-left space-y-8">
            <div className="space-y-6">
              <div className="relative inline-block">
                <div className="absolute -inset-4 bg-gradient-primary opacity-20 blur-2xl rounded-full animate-pulse-glow" />
                <Sparkles className="absolute -top-4 -right-4 w-8 h-8 text-accent animate-pulse floating" />
                <h1 className="relative text-5xl lg:text-6xl font-bold text-gradient leading-tight tracking-tight">
                  ArbiTrader
                  <span className="block text-4xl lg:text-5xl text-gradient-success mt-2">Pro</span>
                </h1>
              </div>
              
              <p className="text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Next-generation arbitrage trading platform powered by advanced AI algorithms and real-time market analysis
              </p>
            </div>
            
            {/* Enhanced feature highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto lg:mx-0">
              <div className="glass p-5 rounded-2xl space-y-3 group hover:scale-105 transition-transform duration-300">
                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Real-time Analysis</p>
                  <p className="text-sm text-muted-foreground">Lightning-fast market monitoring</p>
                </div>
              </div>
              <div className="glass p-5 rounded-2xl space-y-3 group hover:scale-105 transition-transform duration-300">
                <div className="w-10 h-10 bg-gradient-success rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Instant Execution</p>
                  <p className="text-sm text-muted-foreground">Automated profit capture</p>
                </div>
              </div>
            </div>

            {/* Stats section */}
            <div className="flex items-center justify-center lg:justify-start gap-8 mt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-gradient">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gradient">0.02s</div>
                <div className="text-sm text-muted-foreground">Avg Response</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gradient-success">$2.4M+</div>
                <div className="text-sm text-muted-foreground">Profits Generated</div>
              </div>
            </div>
          </div>
          
          {/* Enhanced login form section */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-md relative">
              {/* Glowing background effect */}
              <div className="absolute inset-0 bg-gradient-primary opacity-10 blur-3xl rounded-3xl" />
              <div className="relative">
                <LoginForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'opportunities':
        return (
          <div className="animate-fade-in">
            <OpportunitiesView />
          </div>
        )
      case 'bookmakers':
        return (
          <div className="animate-fade-in">
            <BookmakerSelection />
          </div>
        )
      case 'settings':
        return (
          <div className="animate-fade-in">
            <SettingsView />
          </div>
        )
      case 'admin':
        return (
          <div className="animate-fade-in">
            <AdminView />
          </div>
        )
      default:
        return (
          <div className="animate-fade-in">
            <OpportunitiesView />
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen animated-bg">
      <main className="min-h-screen pb-20">
        {renderContent()}
      </main>
      
      <BottomNavbar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}

export default Index
