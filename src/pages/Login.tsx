
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading, authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const result = await login(email, password);
    
    if (result.error) {
      setError(result.error.message || 'Login failed');
    } else {
      navigate('/', { replace: true });
    }
    
    setIsSubmitting(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast({ title: "Error", description: "Please enter your email", variant: "destructive" });
      return;
    }

    setIsResetting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });

      if (error) throw error;

      toast({
        title: "Check your email",
        description: "We've sent you a password reset link",
      });
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left side - Branding & Info */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-purple-600 to-pink-500 p-12 flex-col justify-center text-white">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl font-bold mb-4">Campus Fenix</h1>
            <p className="text-xl opacity-90 mb-8">
              The ultimate social platform for students. Connect, share, and grow with your campus community.
            </p>
            
            <div className="space-y-4">
              {[
                '🎓 Connect with classmates from your school',
                '💬 Real-time messaging with friends',
                '🎮 Fun games to play between classes',
                '🔔 Smart notifications to stay updated',
                '🛡️ Safe and secure platform'
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                  className="flex items-center gap-3 text-lg"
                >
                  {feature}
                </motion.div>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-white/20">
              <p className="text-sm opacity-80">
                Join thousands of students already on Campus Fenix. Create your free account today 
                and become part of your campus community.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Right side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-4 lg:p-12">
          <div className="w-full max-w-md">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-8 lg:hidden"
            >
              <h1 className="text-4xl font-bold text-primary">Campus Fenix</h1>
              <p className="text-muted-foreground mt-2">Connect with your school community</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="border shadow-lg">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl text-center">
                    {showForgotPassword ? 'Reset Password' : 'Welcome Back'}
                  </CardTitle>
                  <CardDescription className="text-center">
                    {showForgotPassword 
                      ? 'Enter your email to receive a reset link' 
                      : 'Sign in to your account to continue'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(error || authError) && !showForgotPassword && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertDescription>{error || authError}</AlertDescription>
                    </Alert>
                  )}
                  
                  {showForgotPassword ? (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reset-email">Email</Label>
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="Enter your email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          required
                        />
                      </div>
                      
                      <Button type="submit" className="w-full" disabled={isResetting}>
                        {isResetting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          'Send Reset Link'
                        )}
                      </Button>
                      
                      <Button 
                        type="button" 
                        variant="ghost" 
                        className="w-full"
                        onClick={() => setShowForgotPassword(false)}
                      >
                        Back to login
                      </Button>
                    </form>
                  ) : (
                    <>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="password">Password</Label>
                            <button
                              type="button"
                              className="text-sm text-primary hover:underline"
                              onClick={() => setShowForgotPassword(true)}
                            >
                              Forgot password?
                            </button>
                          </div>
                          <div className="relative">
                            <Input
                              id="password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Enter your password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                              aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Signing In..." : "Sign In"}
                        </Button>
                      </form>
                      
                      <div className="mt-4 text-center text-sm">
                        <span className="text-muted-foreground">Don't have an account? </span>
                        <Link to="/signup" className="text-primary hover:underline">
                          Sign up
                        </Link>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Additional info for SEO */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 text-center text-sm text-muted-foreground lg:hidden"
            >
              <p className="mb-4">
                Campus Fenix is the premier social platform for students. Connect with classmates, 
                share your campus experiences, and build lasting friendships.
              </p>
              <div className="flex justify-center gap-4 flex-wrap">
                <span>✓ Free to join</span>
                <span>✓ Safe & secure</span>
                <span>✓ Student focused</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom info section for SEO */}
      <div className="bg-muted/50 border-t py-8 px-4">
        <div className="max-w-4xl mx-auto text-center text-sm text-muted-foreground">
          <h2 className="font-semibold text-foreground mb-2">Why Choose Campus Fenix?</h2>
          <p className="mb-4">
            Campus Fenix is designed specifically for students who want to connect with their campus community. 
            Whether you're looking to find study partners, share campus moments, or stay connected with classmates, 
            our platform provides all the tools you need. With features like real-time messaging, fun games, 
            smart notifications, and a privacy-focused design, Campus Fenix is the perfect companion for your academic journey.
          </p>
          <p>
            © {new Date().getFullYear()} Campus Fenix. All rights reserved. Made with ❤️ for students.
          </p>
        </div>
      </div>
    </main>
  );
};

export default Login;
