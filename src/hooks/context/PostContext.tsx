import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User } from "./auth/types";
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Define the Comment type
export type Comment = {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  likes: string[];
};

// Define the Post type
export type Post = {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  likes: string[];
  comments: Comment[];
  shares: number;
  images?: string[];
  user?: {
    id: string;
    username: string; 
    displayName: string;
    avatar: string;
    email: string;
    class: string;
    coins: number;
    isAdmin: boolean;
    // Add missing required properties from User type for consistency
    interests?: string[];
    location?: string;
    createdAt?: string;
    settings?: any;
  };
};

// Define the context type
export type PostContextType = {
  posts: Post[];
  addPost: (content: string) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  fetchPosts: (type?: string) => Promise<void>;
  loading: boolean;
  isLoading: boolean; // Add this line to fix the error
  createPost: (content: string, images?: string[]) => Promise<Post | null>;
  commentOnPost: (postId: string, content: string) => Promise<void>;
  likeComment: (postId: string, commentId: string) => Promise<void>;
  sharePost: (postId: string) => Promise<void>;
  getUserById: (userId: string) => User | undefined;
};

// Create the context
const PostContext = createContext<PostContextType | undefined>(undefined);

// Post Provider component
export const PostProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [userCache, setUserCache] = useState<Record<string, User>>({});
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Get the current authenticated user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profileData) {
            setCurrentUser({
              id: profileData.id,
              username: profileData.username,
              email: profileData.email || '',
              displayName: profileData.display_name,
              avatar: profileData.avatar_url,
              bio: profileData.bio || '',
              class: profileData.class,
              coins: profileData.coins || 0,
              createdAt: profileData.created_at,
              isAdmin: profileData.is_admin || false,
              interests: profileData.interests || [],
              // The issue is here - we need to use TypeScript's type assertion to handle the location property
              location: (profileData as any).location || profileData.class || '',
              settings: {
                publicLikedPosts: false,
                publicSavedPosts: false,
                emailNotifications: true,
                pushNotifications: true,
                theme: 'system',
                privacy: {
                  profileVisibility: 'everyone',
                  onlineStatus: true,
                  friendRequests: true,
                  showActivity: true,
                  allowMessages: 'everyone',
                  allowTags: true,
                  dataSharing: false,
                  showEmail: false
                }
              }
            });
          }
        } catch (error) {
          console.error("Error fetching current user:", error);
        }
      }
    };

    fetchCurrentUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
          fetchCurrentUser();
        } else if (event === "SIGNED_OUT") {
          setCurrentUser(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Function to fetch user information by ID
  const getUserById = useCallback((userId: string): User | undefined => {
    if (userCache[userId]) {
      return userCache[userId];
    }
    
    // Return the post's embedded user if available
    const postWithUser = posts.find(post => post.userId === userId && post.user);
    return postWithUser?.user as any | undefined;
  }, [userCache, posts]);

  // Function to fetch posts
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id, content, created_at, user_id, images,
          likes:likes(id, user_id),
          comments:comments(id, content, user_id, created_at),
          profiles:profiles(id, username, display_name, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const formattedPosts: Post[] = data.map(post => ({
        id: post.id,
        content: post.content,
        createdAt: post.created_at,
        userId: post.user_id,
        likes: post.likes?.map(like => like.user_id || '') || [],
        comments: (post.comments || []).map((comment: any) => ({
          id: comment.id,
          content: comment.content,
          createdAt: comment.created_at,
          userId: comment.user_id,
          likes: []
        })),
        shares: 0,
        images: post.images || [],
        user: post.profiles ? {
          id: post.profiles.id,
          username: post.profiles.username,
          displayName: post.profiles.display_name,
          avatar: post.profiles.avatar_url || '/placeholder.svg',
          coins: 0,
          email: '',
        class: '',
          isAdmin: false,
          // Added required User type properties
          interests: [],
          location: '',
          createdAt: '',
          settings: {
            publicLikedPosts: false,
            publicSavedPosts: false,
            emailNotifications: true,
            pushNotifications: true,
            theme: 'system',
            privacy: {
              profileVisibility: 'everyone',
              onlineStatus: true,
              friendRequests: true,
              showActivity: true,
              allowMessages: 'everyone',
              allowTags: true,
              dataSharing: false,
              showEmail: false
            }
          }
        } : undefined,
      }));

      setPosts(formattedPosts);
    } catch (error: any) {
      console.error("Error fetching posts:", error.message);
      toast({
        title: "Error fetching posts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to add a post (alias for createPost)
  const addPost = useCallback(async (content: string) => {
    await createPost(content);
  }, []);

  // Function to create a post with optional images
  const createPost = useCallback(async (content: string, images?: string[]): Promise<Post | null> => {
    if (!currentUser) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to add a post.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const postData = { 
        content, 
        user_id: currentUser.id,
        images: images || null
      };

      const { data, error } = await supabase
        .from('posts')
        .insert([postData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Optimistically update the state
      const newPost: Post = {
        id: data.id,
        content: data.content,
        createdAt: data.created_at,
        userId: data.user_id,
        likes: [],
        comments: [],
        shares: 0,
        images: data.images || [],
        user: {
          id: currentUser.id,
          username: currentUser.username,
          displayName: currentUser.displayName,
          avatar: currentUser.avatar || '/placeholder.svg',
          coins: currentUser.coins,
          email: currentUser.email || '',
          class: currentUser.class || '',
          isAdmin: currentUser.isAdmin,
          // Added missing User type properties
          interests: currentUser.interests,
          location: currentUser.location || currentUser.class || '',
          createdAt: currentUser.createdAt,
          settings: currentUser.settings
        },
      };

      setPosts(prevPosts => [newPost, ...prevPosts]);

      toast({
        title: "Post added",
        description: "Your post has been added successfully.",
      });
      
      return newPost;
    } catch (error: any) {
      console.error("Error adding post:", error.message);
      toast({
        title: "Error adding post",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  }, [currentUser]);

  // Function to like a post
  const likePost = useCallback(async (postId: string) => {
    if (!currentUser) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to like a post.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if the user already liked the post
      const post = posts.find(p => p.id === postId);
      if (post && post.likes.includes(currentUser.id)) {
        return; // User already liked this post
      }

      // Optimistically update the state
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId ? { ...post, likes: [...post.likes, currentUser.id] } : post
        )
      );

      const { error } = await supabase
        .from('likes')
        .insert([{ post_id: postId, user_id: currentUser.id }]);

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error("Error liking post:", error.message);
      toast({
        title: "Error liking post",
        description: error.message,
        variant: "destructive",
      });

      // Revert optimistic update on error
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId ? { ...post, likes: post.likes.filter(id => id !== currentUser.id) } : post
        )
      );
    }
  }, [currentUser, posts]);

  // Function to unlike a post
  const unlikePost = useCallback(async (postId: string) => {
    if (!currentUser) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to unlike a post.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Optimistically update the state
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId ? { ...post, likes: post.likes.filter(id => id !== currentUser.id) } : post
        )
      );

      const { error } = await supabase
        .from('likes')
        .delete()
        .match({ post_id: postId, user_id: currentUser.id });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error("Error unliking post:", error.message);
      toast({
        title: "Error unliking post",
        description: error.message,
        variant: "destructive",
      });

      // Revert optimistic update on error
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId ? { ...post, likes: [...post.likes, currentUser.id] } : post
        )
      );
    }
  }, [currentUser]);

  // Function to comment on a post
  const commentOnPost = useCallback(async (postId: string, content: string) => {
    if (!currentUser) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to comment on a post.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([{ post_id: postId, user_id: currentUser.id, content }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Optimistically update the state
      setPosts(prevPosts =>
        prevPosts.map(post => {
          if (post.id === postId) {
            const newComment: Comment = {
              id: data.id,
              content: data.content,
              createdAt: data.created_at,
              userId: data.user_id,
              likes: []
            };
            return { 
              ...post, 
              comments: [...post.comments, newComment] 
            };
          }
          return post;
        })
      );

      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
      });
    } catch (error: any) {
      console.error("Error adding comment:", error.message);
      toast({
        title: "Error adding comment",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [currentUser]);

  // Function to like a comment
  const likeComment = useCallback(async (postId: string, commentId: string) => {
    if (!currentUser) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to like a comment.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Find the post and comment
      setPosts(prevPosts =>
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments: post.comments.map(comment => {
                if (comment.id === commentId) {
                  // Toggle like
                  const isLiked = comment.likes.includes(currentUser.id);
                  return {
                    ...comment,
                    likes: isLiked 
                      ? comment.likes.filter(id => id !== currentUser.id) 
                      : [...comment.likes, currentUser.id]
                  };
                }
                return comment;
              })
            };
          }
          return post;
        })
      );

      // In a real implementation, this would update the database
      // For now, we'll just handle it optimistically in the UI
      toast({
        title: "Comment liked",
        description: "Comment like status updated.",
      });
    } catch (error: any) {
      console.error("Error liking comment:", error.message);
      toast({
        title: "Error updating comment like",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [currentUser]);

  // Function to share a post
  const sharePost = useCallback(async (postId: string) => {
    if (!currentUser) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to share a post.",
        variant: "destructive",
      });
      return;
    }

    // Optimistically update share count
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId ? { ...post, shares: post.shares + 1 } : post
      )
    );

    toast({
      title: "Post shared",
      description: "Post has been shared successfully.",
    });
  }, [currentUser]);

  // Function to delete a post
  const deletePost = useCallback(async (postId: string) => {
    if (!currentUser) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to delete a post.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Optimistically update the state
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));

      const { error } = await supabase
        .from('posts')
        .delete()
        .match({ id: postId, user_id: currentUser.id });

      if (error) {
        throw error;
      }

      toast({
        title: "Post deleted",
        description: "Your post has been deleted successfully.",
      });
    } catch (error: any) {
      console.error("Error deleting post:", error.message);
      toast({
        title: "Error deleting post",
        description: error.message,
        variant: "destructive",
      });

      // Revert optimistic update on error
      fetchPosts();
    }
  }, [currentUser, fetchPosts]);

  return (
    <PostContext.Provider value={{ 
      posts, 
      addPost, 
      likePost, 
      unlikePost, 
      deletePost, 
      fetchPosts, 
      loading,
      isLoading: loading, // Add this line to fix the error
      createPost,
      commentOnPost,
      likeComment,
      sharePost,
      getUserById
    }}>
      {children}
    </PostContext.Provider>
  );
};

// Custom hook to use the post context
export const usePost = (): PostContextType => {
  const context = useContext(PostContext);
  if (context === undefined) {
    throw new Error("usePost must be used within a PostProvider");
  }
  return context;
};
