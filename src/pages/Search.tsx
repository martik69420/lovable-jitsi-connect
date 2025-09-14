
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Search as SearchIcon, User, Users, Book, Globe, Filter, CalendarClock, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { DataTable } from '@/components/ui/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

// Helper function to safely parse dates
const safeParseDate = (dateString: string | null): Date => {
  if (!dateString) return new Date();
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn("Invalid date encountered:", dateString);
      return new Date(); // Return current date as fallback
    }
    return date;
  } catch (error) {
    console.warn("Error parsing date:", dateString, error);
    return new Date(); // Return current date as fallback
  }
};

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialType = searchParams.get('type') || 'users';
  
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState(initialType); // 'users', 'posts', 'groups', 'pages'
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load recent searches from localStorage on component mount
  useEffect(() => {
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    
    const updatedSearches = [
      term,
      ...recentSearches.filter(s => s !== term).slice(0, 4) // Keep max 5 searches
    ];
    
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
    toast({
      title: "Recent searches cleared",
      description: "Your search history has been cleared.",
    });
  };

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    // Update URL params
    setSearchParams({ q: searchTerm, type: searchType });
    saveRecentSearch(searchTerm);
    
    setLoading(true);
    try {
      let data, error;

      switch (searchType) {
        case 'users':
          ({ data, error } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url, bio, school')
            .ilike('display_name', `%${searchTerm}%`)
            .limit(20));
          break;
        case 'posts':
          ({ data, error } = await supabase
            .from('posts')
            .select(`
              id,
              content,
              images,
              created_at,
              user_id,
              likes:likes(id, user_id),
              comments:comments(id, content, user_id, created_at),
              profiles (
                id,
                username,
                display_name,
                avatar_url
              )
            `)
            .ilike('content', `%${searchTerm}%`)
            .order('created_at', { ascending: false })
            .limit(20));
          break;
        default:
          data = [];
          error = null;
          break;
      }

      if (error) {
        throw error;
      }

      setSearchResults(data || []);
    } catch (error: any) {
      console.error("Search error:", error);
      toast({
        title: "Search Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, searchType, toast, setSearchParams]);

  // Run search automatically when component mounts if there's a query in the URL
  useEffect(() => {
    if (initialQuery) {
      handleSearch();
    }
  }, [initialQuery, handleSearch]);

  // Define user columns for DataTable
  const userColumns = [
    {
      header: "User",
      accessorKey: "display_name",
      cell: (user: any) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user.avatar_url || "/placeholder.svg"} alt={user.display_name} />
            <AvatarFallback>{user.display_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <Link to={`/profile/${user.username}`} className="font-medium hover:underline">
              {user.display_name}
            </Link>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
          </div>
        </div>
      ),
    },
    {
      header: "School",
      accessorKey: "school",
    },
    {
      header: "Bio",
      accessorKey: "bio",
      cell: (user: any) => (
        <p className="truncate max-w-md">{user.bio || 'No bio available'}</p>
      ),
    },
    {
      header: "Action",
      accessorKey: "id",
      cell: (user: any) => (
        <Button size="sm" variant="secondary" asChild>
          <Link to={`/profile/${user.username}`}>View Profile</Link>
        </Button>
      ),
    }
  ];

  // Define post columns for DataTable
  const postColumns = [
    {
      header: "Author",
      accessorKey: "profiles.display_name",
      cell: (post: any) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage 
              src={post.profiles?.avatar_url || "/placeholder.svg"} 
              alt={post.profiles?.display_name} 
            />
            <AvatarFallback>
              {post.profiles?.display_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <Link 
              to={`/profile/${post.profiles?.username}`} 
              className="font-medium hover:underline"
            >
              {post.profiles?.display_name}
            </Link>
            <p className="text-sm text-muted-foreground">
              @{post.profiles?.username}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Content",
      accessorKey: "content",
      cell: (post: any) => (
        <p className="truncate max-w-md">{post.content}</p>
      ),
    },
    {
      header: "Posted",
      accessorKey: "created_at",
      cell: (post: any) => (
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(safeParseDate(post.created_at), { addSuffix: true })}
        </span>
      ),
    },
    {
      header: "Engagement",
      accessorKey: "likes",
      cell: (post: any) => (
        <div className="flex gap-3">
          <Badge variant="secondary">
            {post.likes?.length || 0} Likes
          </Badge>
          <Badge variant="outline">
            {post.comments?.length || 0} Comments
          </Badge>
        </div>
      ),
    },
    {
      header: "Action",
      accessorKey: "id",
      cell: (post: any) => (
        <Button size="sm" variant="outline" onClick={() => navigate(`/post/${post.id}`)}>
          View Post
        </Button>
      ),
    }
  ];

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="grid gap-6">
          {/* Search Header */}
          <div className="flex flex-col space-y-4">
            <h1 className="text-3xl font-bold tracking-tight">Search</h1>
            <p className="text-muted-foreground">
              Find users, posts, groups, and more across the platform
            </p>
          </div>

          {/* Search Input */}
          <Card>
            <CardHeader>
              <CardTitle>Search {searchType}</CardTitle>
            </CardHeader>
            <CardContent>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearch();
                }} 
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder={`Search for ${searchType}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <SearchIcon className="w-4 h-4 mr-2" />
                        Search
                      </>
                    )}
                  </Button>
                </div>

                {/* Recent searches */}
                {recentSearches.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center">
                        <CalendarClock className="w-3 h-3 mr-1" />
                        Recent searches
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={clearRecentSearches}
                        className="h-6 px-2 text-xs"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Clear
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {recentSearches.map((term, i) => (
                        <Badge 
                          key={i} 
                          variant="secondary" 
                          className="cursor-pointer"
                          onClick={() => {
                            setSearchTerm(term);
                            handleSearch();
                          }}
                        >
                          {term}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Search Types */}
          <Tabs 
            value={searchType} 
            onValueChange={(value) => {
              setSearchType(value);
              setSearchParams({ q: searchTerm, type: value });
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger value="posts" className="flex items-center gap-2">
                <Book className="w-4 h-4" />
                <span className="hidden sm:inline">Posts</span>
              </TabsTrigger>
              <TabsTrigger value="groups" className="flex items-center gap-2" disabled>
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Groups</span>
              </TabsTrigger>
              <TabsTrigger value="pages" className="flex items-center gap-2" disabled>
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">Pages</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="mt-6">
              {searchTerm && (
                <div className="mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Users matching "{searchTerm}"
                  </h2>
                </div>
              )}

              {searchResults.length > 0 ? (
                <DataTable
                  data={searchResults}
                  columns={userColumns}
                  searchable={false}
                  pagination={true}
                  pageSize={10}
                />
              ) : searchTerm ? (
                loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Card key={i}>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-48" />
                              <Skeleton className="h-3 w-32" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border rounded-lg">
                    <div className="mx-auto bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium">No users found</h3>
                    <p className="text-muted-foreground mt-1">
                      We couldn't find any users matching "{searchTerm}"
                    </p>
                  </div>
                )
              ) : (
                <div className="text-center py-12 border rounded-lg">
                  <div className="mx-auto bg-secondary rounded-full w-12 h-12 flex items-center justify-center mb-4">
                    <SearchIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">Search for users</h3>
                  <p className="text-muted-foreground mt-1">
                    Enter a name or username to find people
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="posts" className="mt-6">
              {searchTerm && (
                <div className="mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Book className="w-4 h-4" />
                    Posts containing "{searchTerm}"
                  </h2>
                </div>
              )}

              {searchResults.length > 0 ? (
                <DataTable
                  data={searchResults}
                  columns={postColumns}
                  searchable={false}
                  pagination={true}
                  pageSize={5}
                />
              ) : searchTerm ? (
                loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Card key={i}>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-48" />
                              <Skeleton className="h-3 w-96" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border rounded-lg">
                    <div className="mx-auto bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                      <Book className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium">No posts found</h3>
                    <p className="text-muted-foreground mt-1">
                      We couldn't find any posts containing "{searchTerm}"
                    </p>
                  </div>
                )
              ) : (
                <div className="text-center py-12 border rounded-lg">
                  <div className="mx-auto bg-secondary rounded-full w-12 h-12 flex items-center justify-center mb-4">
                    <SearchIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">Search for posts</h3>
                  <p className="text-muted-foreground mt-1">
                    Enter keywords to find relevant posts
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="groups" className="mt-6">
              <div className="text-center py-12 border rounded-lg">
                <div className="mx-auto bg-secondary rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">Groups coming soon</h3>
                <p className="text-muted-foreground mt-1">
                  Group search functionality will be available soon
                </p>
              </div>
            </TabsContent>

            <TabsContent value="pages" className="mt-6">
              <div className="text-center py-12 border rounded-lg">
                <div className="mx-auto bg-secondary rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">Pages coming soon</h3>
                <p className="text-muted-foreground mt-1">
                  Page search functionality will be available soon
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
};

export default Search;
