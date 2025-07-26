import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import LoginForm from '@/components/auth/LoginForm'
import { BottomNavbar } from '@/components/layout/BottomNavbar'
import { OpportunitiesView } from '@/components/opportunities/OpportunitiesView'
import { BookmakerSelection } from '@/components/bookmakers/BookmakerSelection'
import { SettingsView } from '@/components/settings/SettingsView'
import { AdminView } from '@/components/admin/AdminView'

const Index = () => {
  const { user, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('opportunities')

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-accent/10">
        <LoginForm />
      </div>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'opportunities':
        return <OpportunitiesView />
      case 'bookmakers':
        return <BookmakerSelection />
      case 'settings':
        return <SettingsView />
      case 'admin':
        return <AdminView />
      default:
        return <OpportunitiesView />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="min-h-screen">
        {renderContent()}
      </main>
      <BottomNavbar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}

export default Index
