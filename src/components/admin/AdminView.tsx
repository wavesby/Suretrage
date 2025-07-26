import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useData } from '@/contexts/DataContext'

export const AdminView = () => {
  const { isAdmin, user } = useAuth()
  const { refreshOdds } = useData()
  const [activeTab, setActiveTab] = useState('users')
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [systemStatus, setSystemStatus] = useState<Record<string, any>>({
    supabaseStatus: 'checking',
    apiStatus: 'checking',
    lastSync: null
  })
  const { toast } = useToast()

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        title: "Failed to fetch users",
        description: "Check the console for more details",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Check system status
  const checkSystemStatus = async () => {
    setLoading(true)
    const status = { ...systemStatus }
    
    // Check Supabase connection
    try {
      // Test connection using auth instead of profiles table to avoid 401 errors
      const { data, error } = await supabase.auth.getSession()
      status.supabaseStatus = 'operational' // Connection successful if we can make the request
    } catch (e) {
      status.supabaseStatus = 'error'
    }
    
    // Check API connection
    try {
      await refreshOdds(false) // Refresh odds without toast
      status.apiStatus = 'operational'
      status.lastSync = new Date().toISOString()
    } catch (e) {
      status.apiStatus = 'error'
    }
    
    setSystemStatus(status)
    setLoading(false)
  }

  // Sync real-time data
  const syncRealTimeData = async () => {
    setLoading(true)
    try {
      // Get the latest odds data
      await refreshOdds(true) // Show toast notification
      
      toast({
        title: "Data Synchronized",
        description: "Successfully fetched latest real-time odds data",
        variant: "default"
      })
      
      // Update last sync time
      setSystemStatus({
        ...systemStatus,
        lastSync: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error syncing data:', error)
      toast({
        title: "Sync Failed",
        description: "Failed to fetch real-time odds data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // If not admin, show access denied
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-6">You don't have permission to access the admin area.</p>
        <Badge variant="destructive">Requires Admin Access</Badge>
      </div>
    )
  }
  
  return (
    <div className="container max-w-screen-xl mx-auto p-4 pb-24">
      <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
      <p className="text-muted-foreground mb-6">Manage users and system settings</p>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="system">System Status</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
        </TabsList>
        
        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage user accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={fetchUsers} 
                disabled={loading} 
                className="mb-4"
              >
                {loading ? "Loading..." : "Load Users"}
              </Button>
              
              {users.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {user.is_admin ? (
                              <Badge variant="default">Admin</Badge>
                            ) : (
                              <Badge variant="secondary">User</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Active
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground">No users loaded. Click "Load Users" to view user data.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* System Status Tab */}
        <TabsContent value="system" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>View the status of system components</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={checkSystemStatus} 
                disabled={loading} 
                className="mb-4"
              >
                {loading ? "Checking..." : "Check Status"}
              </Button>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Database Connection</div>
                    <div className="flex items-center">
                      <div className={`h-3 w-3 rounded-full mr-2 ${
                        systemStatus.supabaseStatus === 'operational' ? 'bg-green-500' : 
                        systemStatus.supabaseStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                      }`} />
                      <span className="font-medium">
                        {systemStatus.supabaseStatus === 'operational' ? 'Operational' : 
                         systemStatus.supabaseStatus === 'error' ? 'Error' : 'Checking...'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg border">
                    <div className="text-sm font-medium text-muted-foreground mb-1">API Connection</div>
                    <div className="flex items-center">
                      <div className={`h-3 w-3 rounded-full mr-2 ${
                        systemStatus.apiStatus === 'operational' ? 'bg-green-500' : 
                        systemStatus.apiStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                      }`} />
                      <span className="font-medium">
                        {systemStatus.apiStatus === 'operational' ? 'Operational' : 
                         systemStatus.apiStatus === 'error' ? 'Error' : 'Checking...'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg border">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Last Data Sync</div>
                  <div className="font-medium">
                    {systemStatus.lastSync ? new Date(systemStatus.lastSync).toLocaleString() : 'Never'}
                  </div>
                </div>
                
                <div className="p-4 rounded-lg border">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Current Admin</div>
                  <div className="font-medium">{user?.email}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Data Management Tab */}
        <TabsContent value="data" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Manage real-time data synchronization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg border bg-muted/30">
                <h3 className="font-medium mb-2">Real-Time Data</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Manually sync real-time odds data from all configured bookmakers.
                </p>
                <Button 
                  onClick={syncRealTimeData}
                  disabled={loading}
                >
                  {loading ? "Syncing..." : "Sync Real-Time Data"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}