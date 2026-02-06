import React, { Suspense, lazy, useEffect, Component, ReactNode } from 'react';
import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { PostProvider } from '@/context/PostContext';
import { GameProvider } from '@/context/GameContext';
import { Toaster } from './component/ui/toaster';
import { AuthProvider } from './context/auth';
import { TooltipProvider } from '@/component/ui/tooltip';
import UnreadMessagesTitle from '@/component/system/UnreadMessagesTitle';
import NotificationToastContainer from '@/component/notifications/NotificationToastContainer';
import GlobalCallHandler from '@/component/calling/GlobalCallHandler';

// Error boundary for catching render errors
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#0f172a' }}>
          <div className="text-center p-6" style={{ color: 'white' }}>
            <h1 className="text-xl font-bold mb-4">Something went wrong</h1>
            <p className="mb-4 text-gray-300 text-sm max-w-md">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button 
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }} 
              className="px-4 py-2 rounded-md"
              style={{ backgroundColor: '#6366f1', color: 'white' }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Settings = lazy(() => import('./pages/Settings'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const Messages = lazy(() => import('./pages/Messages'));
const Search = lazy(() => import('./pages/Search'));
const Friends = lazy(() => import('./pages/Friends'));
const AddFriends = lazy(() => import('./pages/AddFriends'));
const Games = lazy(() => import('./pages/Games'));
const Profile = lazy(() => import('./pages/Profile'));
const Tetris = lazy(() => import('@/pages/games/Tetris'));
const Post = lazy(() => import('@/pages/Post'));
const FriendRequests = lazy(() => import('./pages/FriendRequests'));
const Achievements = lazy(() => import('./pages/Achievements'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const NotFound = lazy(() => import('./pages/NotFound'));
const TicTacToe = lazy(() => import('./pages/games/TicTacToe'));
const Pong = lazy(() => import('./pages/games/Pong'));
const Asteroids = lazy(() => import('./pages/games/Asteroids'));
const GeometryDash = lazy(() => import('./pages/games/GeometryDash'));

// Initialize React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000,
      retry: 1,
    },
  },
});

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Hook for global unhandled promise rejections
function useGlobalErrorHandler() {
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      // Log but don't crash the app
      console.warn('Unhandled promise rejection:', event.reason);
      event.preventDefault();
    };

    const handleError = (event: ErrorEvent) => {
      // Log but don't crash the app
      console.warn('Unhandled error:', event.message);
      event.preventDefault();
    };

    window.addEventListener('unhandledrejection', handleRejection);
    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);
}

function App() {
  useGlobalErrorHandler();

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <AuthProvider>
              <LanguageProvider>
                <GameProvider>
                  <NotificationProvider>
                    <PostProvider>
                      <UnreadMessagesTitle />
                      <NotificationToastContainer />
                      <GlobalCallHandler />
                      <Suspense fallback={<PageLoader />}>
                        <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/auth/callback" element={<AuthCallback />} />
                        <Route path="/messages" element={<Messages />} />
                        <Route path="/search" element={<Search />} />
                        <Route path="/friends" element={<Friends />} />
                        <Route path="/friend-requests" element={<FriendRequests />} />
                        <Route path="/add-friends" element={<AddFriends />} />
                        <Route path="/games" element={<Games />} />
                        <Route path="/games/tetris" element={<Tetris />} />
                        <Route path="/games/tictactoe" element={<TicTacToe />} />
                        <Route path="/games/pong" element={<Pong />} />
                        <Route path="/games/asteroids" element={<Asteroids />} />
                        <Route path="/games/geometrydash" element={<GeometryDash />} />
                        <Route path="/achievements" element={<Achievements />} />
                        <Route path="/post/:postId" element={<Post />} />
                        <Route path="/profile/:username" element={<Profile />} />
                        <Route path="/admin" element={<AdminPanel />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                    <Toaster />
                  </PostProvider>
                </NotificationProvider>
              </GameProvider>
            </LanguageProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
