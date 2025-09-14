
// Re-export everything from the auth context
export { AuthContext, useAuth } from './auth/AuthContext';
export { AuthProvider } from './auth/AuthProvider';
export type { User, ProfileUpdateData, UserSettings } from './auth/types';

// This file is an index file that re-exports everything needed from the auth directory
// This allows imports like: import { useAuth } from '@/context/auth'
// Instead of: import { useAuth } from '@/context/auth/AuthContext'
