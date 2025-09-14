
import { User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar: string;
  bio?: string;
  class: string;
  coins: number;
  createdAt: string;
  isAdmin: boolean;
  interests?: string[];
  location?: string;
  settings: UserSettings;
}

export interface UserSettings {
  publicLikedPosts: boolean;
  publicSavedPosts: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  theme: string;
  privacy: {
    profileVisibility: string;
    onlineStatus: boolean;
    friendRequests: boolean;
    showActivity: boolean;
    allowMessages: string;
    allowTags: boolean;
    dataSharing: boolean;
    showEmail: boolean;
  };
}

// This interface should match what the Supabase database expects
export interface ProfileUpdateData {
  display_name?: string;
  username?: string;
  avatar_url?: string;
  class?: string;
  bio?: string;
  interests?: string[];
  settings?: Record<string, any>;
  location?: string;
}

// Complete AuthContextType to match what's actually implemented
export interface AuthContextType {
  user: User | null;
  profile: any | null;
  session: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  refreshUser: () => Promise<any>;
  updateProfile: (updates: ProfileUpdateData) => Promise<any>;
  signOut: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ error?: any }>;
  logout: () => Promise<void>;
  register: (email: string, password: string, userData?: any) => Promise<{ error?: any }>;
  updateUser: (updates: any) => Promise<any>;
  updateUserProfile: (updates: any) => Promise<any>;
  uploadProfilePicture: (file: File) => Promise<any>;
  addCoins: (amount: number) => Promise<any>;
}
