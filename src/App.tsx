import { Suspense, lazy, Component, ErrorInfo, ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { UserPreferencesProvider } from "@/contexts/UserPreferencesContext";
import { DataProvider } from "@/contexts/DataContext";
import { Watermark } from "@/components/ui/watermark";
import { Zap, AlertTriangle, RefreshCw, Sparkles } from "lucide-react";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Create a new QueryClient instance with enhanced configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
      staleTime: 30000,
      refetchInterval: 60000, // Auto-refresh every minute
    },
  },
});

// Enhanced Error boundary component with futuristic design
class ErrorBoundary extends Component<{ children: ReactNode, fallback?: ReactNode }> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    console.error("Error caught by boundary:", error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Application error:", error);
    console.error("Component stack:", errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen animated-bg flex flex-col items-center justify-center p-6 text-center">
          <div className="glass max-w-md w-full p-8 rounded-3xl space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-danger rounded-full blur-xl opacity-20 animate-pulse-glow"></div>
              <AlertTriangle className="relative w-16 h-16 mx-auto text-destructive animate-bounce-in" />
            </div>
            
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-gradient">System Error Detected</h2>
              <p className="text-destructive font-medium">
                {this.state.error ? (this.state.error as Error).message : "An unexpected error occurred"}
              </p>
              <p className="text-muted-foreground text-sm">
                Our advanced diagnostic systems have detected an anomaly. 
                Please try the recovery options below.
              </p>
            </div>

            <div className="space-y-3">
              <button
                className="w-full primary-button px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="w-4 h-4" />
                Restart System
              </button>
              <button
                className="w-full bg-gradient-secondary text-foreground px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-glow"
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                <Sparkles className="w-4 h-4" />
                Attempt Recovery
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Enhanced loading component with futuristic design
const LoadingScreen = () => (
  <div className="min-h-screen animated-bg flex items-center justify-center">
    <div className="text-center space-y-6">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-primary rounded-full blur-xl opacity-30 animate-pulse-glow"></div>
        <div className="relative w-16 h-16 mx-auto">
          <Zap className="w-16 h-16 text-primary animate-spin-slow" />
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-gradient">ArbiTrader Pro</h3>
        <p className="text-muted-foreground">Initializing advanced arbitrage systems...</p>
        
        <div className="flex items-center justify-center space-x-1 mt-4">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
      </div>
    </div>
  </div>
);

// Enhanced page transition wrapper
const PageTransition = ({ children }: { children: ReactNode }) => (
  <div className="animate-fade-in">
    {children}
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UserPreferencesProvider>
          <DataProvider>
            <NotificationProvider>
              <TooltipProvider>
                {/* Enhanced toast notifications */}
                <Toaster />
                <Sonner 
                  theme="dark"
                  position="top-right"
                />
                
                <BrowserRouter>
                  <div className="min-h-screen animated-bg relative">
                    <Suspense fallback={<LoadingScreen />}>
                      <Routes>
                        <Route 
                          path="/" 
                          element={
                            <PageTransition>
                              <Index />
                            </PageTransition>
                          } 
                        />
                        <Route path="/index" element={<Navigate to="/" replace />} />
                        <Route path="/home" element={<Navigate to="/" replace />} />
                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route 
                          path="*" 
                          element={
                            <PageTransition>
                              <NotFound />
                            </PageTransition>
                          } 
                        />
                      </Routes>
                    </Suspense>
                    {/* Global watermark */}
                    <Watermark position="fixed" className="bottom-4 right-4 z-10" variant="decorative" />
                  </div>
                </BrowserRouter>
              </TooltipProvider>
            </NotificationProvider>
          </DataProvider>
        </UserPreferencesProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
