
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { cleanupAuthState } from '@/context/auth/authUtils';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Clear any stale auth state
        cleanupAuthState();
        
        // Check if we have a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          throw sessionError;
        }
        
        if (session) {
          // If we have a session, refresh the user data
          try {
            await refreshUser();
            
            toast({
              title: "Welcome!",
              description: "You have successfully signed in with Google.",
            });
            
            // Redirect to the home page
            navigate('/', { replace: true });
          } catch (refreshError) {
            console.error("Error refreshing user:", refreshError);
            setError("Your account was authenticated, but we had trouble loading your profile. Please try again.");
          }
        } else {
          // If we don't have a session, something went wrong
          setError("Authentication failed. No session was created. Please try again.");
          
          // Redirect to login after a delay
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 3000);
        }
      } catch (err: any) {
        console.error("Auth callback error:", err);
        setError(err.message || "Authentication failed. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    };

    handleAuthCallback();
  }, [navigate, refreshUser]);

  const handleRetry = () => {
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md text-center p-6 rounded-lg shadow-lg border border-border bg-card">
        {isProcessing && !error ? (
          <>
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h1 className="text-2xl font-bold mb-2">Completing Sign In</h1>
            <p className="text-muted-foreground">Please wait while we complete your authentication...</p>
          </>
        ) : error ? (
          <>
            <div className="text-destructive text-xl font-bold mb-4">Authentication Failed</div>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleRetry} className="mt-4">Try Again</Button>
          </>
        ) : (
          <>
            <div className="text-success text-xl font-bold mb-4">Authentication Successful!</div>
            <p className="text-muted-foreground">You are now signed in.</p>
            <p className="mt-4">Redirecting you to the home page...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
