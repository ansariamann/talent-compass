import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, Shield } from 'lucide-react';
import { z } from 'zod';

const API_BASE = import.meta.env.VITE_API_URL || '';

const resetSchema = z
    .object({
        password: z.string().min(8, 'Password must be at least 8 characters'),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmPassword?: string }>({});

    useEffect(() => {
        if (!token) {
            setError('Missing reset token. Please use the link from your email.');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});

        const result = resetSchema.safeParse({ password, confirmPassword });
        if (!result.success) {
            const errors: { password?: string; confirmPassword?: string } = {};
            result.error.issues.forEach((issue) => {
                const field = issue.path[0] as 'password' | 'confirmPassword';
                errors[field] = issue.message;
            });
            setFieldErrors(errors);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE}/auth/password/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, new_password: password }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => null);
                throw new Error(data?.detail || 'Reset failed. The link may have expired.');
            }

            setIsSuccess(true);
        } catch (err) {
            setError((err as Error).message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Success state
    if (isSuccess) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-8">
                <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Password reset!</CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Your password has been changed successfully. You can now sign in with your new password.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link to="/login">
                            <Button className="w-full">Go to login</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
            <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Set new password</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Choose a strong password for your account.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {error && (
                        <div className="mb-4 flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">New password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`pr-10 ${fieldErrors.password ? 'border-destructive' : ''}`}
                                    disabled={isLoading || !token}
                                    autoComplete="new-password"
                                    autoFocus
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
                            {fieldErrors.password && (
                                <p className="text-xs text-destructive">{fieldErrors.password}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm password</Label>
                            <Input
                                id="confirmPassword"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={fieldErrors.confirmPassword ? 'border-destructive' : ''}
                                disabled={isLoading || !token}
                                autoComplete="new-password"
                            />
                            {fieldErrors.confirmPassword && (
                                <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>
                            )}
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading || !token}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Resetting...
                                </>
                            ) : (
                                'Reset password'
                            )}
                        </Button>

                        <Link
                            to="/login"
                            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to login
                        </Link>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
