import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Mail, Lock, Zap, Shield, Sparkles, ChevronRight, AlertCircle } from 'lucide-react';
import { Watermark } from '@/components/ui/watermark';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { signIn } = useAuth();

  // Floating particles animation
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2
    }));
    setParticles(newParticles);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signIn(email, password);
    } catch (error: any) {
      setError(error.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const quickFillDemo = (type: 'user' | 'admin') => {
    const credentials = type === 'user' 
      ? { email: 'user@example.com', password: 'password123' }
      : { email: 'admin@example.com', password: 'admin123' };
    
    setEmail(credentials.email);
    setPassword(credentials.password);
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Floating particles background */}
      <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-1 h-1 bg-primary/20 rounded-full floating"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`
            }}
          />
        ))}
      </div>

      <Card className="glass border-0 shadow-2xl backdrop-blur-xl relative overflow-hidden group">
        {/* Animated border gradient */}
        <div className="absolute inset-0 bg-gradient-primary opacity-20 rounded-3xl blur animate-pulse-glow" />
        
        <CardHeader className="relative space-y-6 text-center pb-8">
          {/* Logo/Icon */}
          <div className="mx-auto relative">
            <div className="absolute inset-0 bg-gradient-primary rounded-full blur-xl opacity-30 animate-pulse-glow" />
            <div className="relative w-16 h-16 mx-auto bg-gradient-primary rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>

          <div className="space-y-3">
            <CardTitle className="text-3xl font-bold text-gradient flex items-center justify-center gap-2">
              <Zap className="w-6 h-6" />
              ArbiTrader Pro
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Welcome back to the future of arbitrage trading
            </CardDescription>
          </div>

          {/* Quick demo buttons */}
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => quickFillDemo('user')}
              className="text-xs px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-full hover:bg-blue-500/30 transition-colors border border-blue-500/30"
            >
              Demo User
            </button>
            <button
              onClick={() => quickFillDemo('admin')}
              className="text-xs px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-full hover:bg-purple-500/30 transition-colors border border-purple-500/30"
            >
              Demo Admin
            </button>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error display */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-xl flex items-center gap-2 animate-bounce-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Email field */}
            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email Address
              </Label>
              <div className="relative group">
                <div className={`absolute inset-0 bg-gradient-primary rounded-xl opacity-0 group-hover:opacity-20 transition-opacity blur ${focusedField === 'email' ? 'opacity-20' : ''}`} />
                <div className="relative flex items-center">
                  <Mail className={`absolute left-3 w-4 h-4 transition-colors ${focusedField === 'email' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className="pl-10 pr-4 py-3 bg-background/50 border-border/50 rounded-xl focus:border-primary/50 transition-all duration-300"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <button
                  type="button"
                  className="text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative group">
                <div className={`absolute inset-0 bg-gradient-primary rounded-xl opacity-0 group-hover:opacity-20 transition-opacity blur ${focusedField === 'password' ? 'opacity-20' : ''}`} />
                <div className="relative flex items-center">
                  <Lock className={`absolute left-3 w-4 h-4 transition-colors ${focusedField === 'password' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="pl-10 pr-12 py-3 bg-background/50 border-border/50 rounded-xl focus:border-primary/50 transition-all duration-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Sign in button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-primary hover:scale-[1.02] transition-all duration-300 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
              <div className="relative flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Access Dashboard</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </Button>
          </form>
        </CardContent>

        <CardFooter className="relative pt-6 pb-8">
          <div className="w-full text-center">
            <div className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <button className="text-primary hover:text-primary/80 transition-colors font-medium">
                Request Access
              </button>
            </div>
            
            {/* Security badge */}
            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground/70">
              <Shield className="w-3 h-3" />
              <span>Enterprise-grade security</span>
              <Sparkles className="w-3 h-3" />
            </div>
          </div>
        </CardFooter>

        {/* Watermark */}
        <Watermark position="absolute" className="bottom-2 right-2" variant="minimal" />
      </Card>
    </div>
  );
}