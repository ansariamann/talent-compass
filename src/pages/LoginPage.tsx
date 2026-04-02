import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2, Shield, Users, Briefcase, Sparkles } from 'lucide-react';
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
      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/8 blur-[120px] animate-pulse-subtle" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/6 blur-[100px] animate-pulse-subtle" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full bg-primary/4 blur-[80px] animate-pulse-subtle" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Mesh gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(var(--primary)/0.2)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--primary)/0.1)_0%,transparent_50%)]" />

        {/* Floating geometric shapes */}
        <div className="absolute top-[15%] right-[15%] w-20 h-20 border border-primary/20 rounded-2xl rotate-12 animate-pulse-subtle" />
        <div className="absolute top-[60%] right-[25%] w-12 h-12 border border-primary/15 rounded-xl -rotate-12 animate-pulse-subtle" style={{ animationDelay: '0.7s' }} />
        <div className="absolute bottom-[20%] left-[20%] w-16 h-16 border border-primary/10 rounded-full animate-pulse-subtle" style={{ animationDelay: '1.2s' }} />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />

        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6">
              <Sparkles className="w-3 h-3" />
              Applicant Tracking System
            </div>
            <h1 className="text-5xl font-bold text-foreground mb-5 leading-tight">
              HR <span className="text-gradient">Management</span>
              <br />Platform
            </h1>
            <p className="text-base text-muted-foreground max-w-sm leading-relaxed">
              Streamline your hiring process with our comprehensive applicant tracking system.
            </p>
          </div>

          <div className="space-y-5">
            <FeatureItem
              icon={<Users className="w-5 h-5" />}
              title="Candidate Management"
              description="Track and manage candidates through every stage"
            />
            <FeatureItem
              icon={<Briefcase className="w-5 h-5" />}
              title="Application Tracking"
              description="Monitor applications with real-time status updates"
            />
            <FeatureItem
              icon={<Shield className="w-5 h-5" />}
              title="Secure & Compliant"
              description="Enterprise-grade security for your sensitive data"
            />
          </div>
        </div>

        {/* Bottom gradient line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        {/* Right edge glow */}
        <div className="absolute top-0 bottom-0 right-0 w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent" />
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md">
          {/* Glass card */}
          <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl shadow-primary/5 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/10">
                <Shield className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
              <p className="text-sm text-muted-foreground mt-1.5">
                Enter your credentials to access your account
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

              <Button
                type="submit"
                className="w-full h-11 text-sm font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50" />
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
          <p className="text-center text-xs text-muted-foreground/50 mt-6">
            Protected by enterprise-grade encryption
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({
  icon,
  title,
  description
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 group">
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center text-primary group-hover:bg-primary/15 group-hover:shadow-md group-hover:shadow-primary/10 transition-all duration-300">
        {icon}
      </div>
      <div>
        <h3 className="font-medium text-foreground text-sm">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
