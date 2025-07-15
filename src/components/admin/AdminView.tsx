import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Database, Bell, Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { seedMockOdds } from '@/utils/mockData'

interface UserProfile {
  id: string
  email: string
  is_admin: boolean
  created_at: string
}

export const AdminView = () => {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const { isAdmin } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (isAdmin) {
      loadUsers()
    }
  }, [isAdmin])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error loading users:', error)
      toast({
        title: "Loading Failed",
        description: "Failed to load users",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleUserAdmin = async (userId: string, currentIsAdmin: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !currentIsAdmin })
        .eq('id', userId)

      if (error) throw error

      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, is_admin: !currentIsAdmin }
          : user
      ))

      toast({
        title: "User Updated",
        description: `User ${!currentIsAdmin ? 'granted' : 'removed'} admin access`
      })
    } catch (error) {
      console.error('Error updating user:', error)
      toast({
        title: "Update Failed",
        description: "Failed to update user privileges",
        variant: "destructive"
      })
    }
  }

  const handleSeedOdds = async () => {
    setSeeding(true)
    try {
      const success = await seedMockOdds()
      if (success) {
        toast({
          title: "Mock Data Seeded",
          description: "Successfully loaded mock odds data"
        })
      } else {
        throw new Error('Failed to seed data')
      }
    } catch (error) {
      console.error('Error seeding odds:', error)
      toast({
        title: "Seeding Failed",
        description: "Failed to seed mock odds data",
        variant: "destructive"
      })
    } finally {
      setSeeding(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="p-4 pb-20">
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-medium mb-2">Access Denied</h3>
            <p className="text-muted-foreground">You don't have admin privileges</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 pb-20 space-y-6">
      <h1 className="text-2xl font-bold">Admin Panel</h1>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Mock Data
            </CardTitle>
            <CardDescription>
              Seed the database with sample odds data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleSeedOdds}
              disabled={seeding}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {seeding ? 'Seeding...' : 'Seed Mock Odds'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Send alerts to all users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled>
              <Bell className="h-4 w-4 mr-2" />
              Send Alert (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>
            Manage user accounts and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse h-16 bg-muted rounded" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {users.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{user.email}</div>
                    <div className="text-sm text-muted-foreground">
                      Joined: {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={user.is_admin ? 'default' : 'secondary'}>
                      {user.is_admin ? 'Admin' : 'User'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleUserAdmin(user.id, user.is_admin)}
                    >
                      {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                    </Button>
                  </div>
                </div>
              ))}
              
              {users.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No users found
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}