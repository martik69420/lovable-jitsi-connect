
// Re-export everything from the auth context
export { AuthContext, useAuth } from './AuthContext';
export { AuthProvider } from './AuthProvider';
export type { User, ProfileUpdateData, UserSettings } from './types';

// This file is an index file that re-exports everything needed from the auth directory
// This allows imports like: import { useAuth } from '@/context/auth'
// Instead of: import { useAuth } from '@/context/auth/AuthContext'
