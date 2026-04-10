import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2, Shield, Users, Briefcase, Sparkles, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as 'email' | 'password';
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const { success, error } = await login(email, password);

    if (success) {
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      navigate('/');
    } else {
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: error || 'Invalid credentials',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      {/* Animated aurora background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[800px] h-[800px] rounded-full opacity-20 blur-[150px]"
          style={{ background: 'hsl(var(--primary))' }}
        />
        <div
          className="absolute right-0 bottom-0 w-[600px] h-[600px] rounded-full opacity-10 blur-[120px]"
          style={{ background: 'hsl(160 85% 45%)' }}
        />
        <div
          className="absolute left-[40%] top-[30%] w-[400px] h-[400px] rounded-full opacity-10 blur-[100px]"
          style={{ background: 'hsl(45 100% 55%)' }}
        />
      </div>

      {/* Left side - Immersive branding */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        {/* Layered gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,hsl(var(--primary)/0.15)_0%,transparent_60%)]" />

        {/* Animated grid */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />

        {/* Floating 3D-ish cards */}
        <div
          className="absolute top-[12%] right-[10%] w-48 h-32 rounded-2xl border border-primary/15 bg-primary/5 backdrop-blur-sm"
        >
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-[hsl(var(--status-success))]" />
              <span className="text-xs text-muted-foreground">Live Pipeline</span>
            </div>
            <div className="space-y-1.5">
              <div className="h-2 w-full rounded-full bg-primary/10">
                <div
                  className="h-full rounded-full bg-primary/40"
                  style={{ width: '60%' }}
                />
              </div>
              <div className="h-2 w-3/4 rounded-full bg-primary/10">
                <div
                  className="h-full rounded-full bg-[hsl(var(--status-success))]/40"
                  style={{ width: '80%' }}
                />
              </div>
            </div>
          </div>
        </div>

        <div
          className="absolute bottom-[18%] right-[18%] w-40 h-28 rounded-2xl border border-primary/10 bg-primary/5 backdrop-blur-sm"
        >
          <div className="p-4">
            <div className="text-xs text-muted-foreground mb-2">Hired Today</div>
            <div className="text-2xl font-bold text-gradient">12</div>
            <div className="text-xs text-[hsl(var(--status-success))] mt-1">↑ 24% vs last week</div>
          </div>
        </div>


        {/* Main content */}
        <div className="relative z-10 flex flex-col justify-center px-16 max-w-xl">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-8">
              <Sparkles className="w-3 h-3" />
              Next-Gen ATS Platform
            </div>

            <h1 className="text-6xl font-bold text-foreground mb-6 leading-[1.1] tracking-tight">
              Hire <span className="text-gradient">Smarter,</span>
              <br />Not Harder.
            </h1>

            <p className="text-lg text-muted-foreground max-w-md leading-relaxed mb-12">
              The modern applicant tracking system that turns chaos into clarity. From resume to offer in record time.
            </p>
          </div>

          <div
            className="space-y-4"
          >
            {[
              { icon: <Users className="w-5 h-5" />, title: 'Smart Pipeline', desc: 'AI-powered candidate matching & tracking' },
              { icon: <Briefcase className="w-5 h-5" />, title: 'Real-time Analytics', desc: 'Live dashboards with actionable insights' },
              { icon: <Shield className="w-5 h-5" />, title: 'Enterprise Ready', desc: 'SOC2 compliant with role-based access' },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-3 -mx-3 rounded-xl hover:bg-primary/5 transition-colors group cursor-default"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center text-primary group-hover:bg-primary/15 group-hover:scale-110 transition-all duration-300">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/0 group-hover:text-primary ml-auto transition-all duration-300 group-hover:translate-x-1" />
              </div>
            ))}
          </div>
        </div>

        {/* Divider line */}
        <div className="absolute top-0 bottom-0 right-0 w-px bg-gradient-to-b from-transparent via-border/50 to-transparent" />
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div
          className="w-full max-w-md"
        >
          {/* Glass card */}
          <div className="rounded-3xl border border-border/30 bg-card/30 backdrop-blur-2xl shadow-2xl shadow-primary/5 p-10 relative overflow-hidden">
            {/* Subtle inner glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            {/* Header */}
            <div className="text-center mb-8">
              <div
                className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/10 relative hover:scale-105 transition-transform"
              >
                <Shield className="w-8 h-8 text-primary" />
                <div className="absolute inset-0 rounded-2xl bg-primary/10 animate-pulse-subtle" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Sign in to your workspace
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={errors.email ? 'border-destructive' : ''}
                  disabled={isLoading}
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`pr-10 ${errors.password ? 'border-destructive' : ''}`}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-border bg-muted accent-primary"
                  />
                  <span className="text-muted-foreground">Remember me</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full h-12 text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 transition-all duration-300 rounded-xl"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/30" />
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>
                Don't have an account?{' '}
                <button className="text-primary hover:text-primary/80 transition-colors font-medium">
                  Contact administrator
                </button>
              </p>
            </div>
          </div>

          {/* Bottom text */}
          <p className="text-center text-xs text-muted-foreground/40 mt-6">
            🔒 Protected by enterprise-grade encryption
          </p>
        </div>
      </div>
    </div>
  );
}
