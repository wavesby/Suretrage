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
import { Loader2 } from "lucide-react";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Create a new QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

// Error boundary component to catch and display errors gracefully
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
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
          <p className="mb-2 text-red-600">
            {this.state.error ? (this.state.error as Error).message : "Unknown error"}
          </p>
          <p className="mb-6 text-muted-foreground">
            The application encountered an error. Please try refreshing the page.
          </p>
          <button
            className="px-4 py-2 bg-primary text-primary-foreground rounded mb-4"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
          <button
            className="px-4 py-2 bg-gray-600 text-white rounded"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try to Recover
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading component for Suspense fallback
const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <span className="ml-2 text-lg">Loading...</span>
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
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Suspense fallback={<LoadingScreen />}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/index" element={<Navigate to="/" replace />} />
                      <Route path="/home" element={<Navigate to="/" replace />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
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
