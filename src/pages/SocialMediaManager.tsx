import { Helmet } from "react-helmet-async";
import AppHeader from "@/components/layout/AppHeader";
import { EnhancedTabs, TabsContent } from "@/components/ui/enhanced-tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, BarChart3, Plus, Clock, CheckCircle, AlertCircle, Edit3, FileText, Activity } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { SocialMediaComposer } from "@/components/social/SocialMediaComposer";
import { SocialMediaCalendar } from "@/components/social/SocialMediaCalendar";
import { SocialMediaAnalytics } from "@/components/social/SocialMediaAnalytics";
import { SocialMediaTemplates } from "@/components/social/SocialMediaTemplates";

interface SocialMediaPost {
  id: string;
  platform: string;
  post_content: string;
  scheduled_at: string | null;
  posted_at: string | null;
  status: string;
  engagement_metrics: any;
  created_at: string;
}

const SocialMediaManager = () => {
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPosts: 0,
    scheduledPosts: 0,
    publishedToday: 0,
    totalEngagement: 0
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('social_media_posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPosts(data || []);
      
      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const totalPosts = data?.length || 0;
      const scheduledPosts = data?.filter(p => p.status === 'scheduled').length || 0;
      const publishedToday = data?.filter(p => 
        p.posted_at && p.posted_at.startsWith(today)
      ).length || 0;
      const totalEngagement = data?.reduce((sum, post) => {
        const metrics = post.engagement_metrics || {};
        if (typeof metrics === 'object' && metrics !== null) {
          return sum + ((metrics as any).likes || 0) + ((metrics as any).shares || 0) + ((metrics as any).comments || 0);
        }
        return sum;
      }, 0) || 0;

      setStats({
        totalPosts,
        scheduledPosts,
        publishedToday,
        totalEngagement
      });
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      toast(`Failed to load posts: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    const icons = {
      facebook: "📘",
      instagram: "📷",
      linkedin: "💼",
      twitter: "𝕏"
    };
    return icons[platform as keyof typeof icons] || "📱";
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: "bg-gray-100 text-gray-800",
      scheduled: "bg-blue-100 text-blue-800",
      posted: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800"
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      draft: Clock,
      scheduled: Calendar,
      posted: CheckCircle,
      failed: AlertCircle
    };
    const Icon = icons[status as keyof typeof icons] || Clock;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <>
      <Helmet>
        <title>Social Media Manager — Hyper Pulse Content</title>
        <meta name="description" content="Manage your social media content, schedule posts, and track performance across all platforms." />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : '/social-media'} />
      </Helmet>
      <AppHeader />
      <main className="container px-3 md:px-4 py-4 md:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl md:text-3xl font-semibold tracking-tight truncate">Social Media Manager</h1>
            <p className="text-sm md:text-base text-muted-foreground">Create, schedule, and track your social media content</p>
          </div>
          <Button className="gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            <span className="sm:hidden">Create Post</span>
            <span className="hidden sm:inline">Create Post</span>
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          <Card>
            <CardHeader className="flex-row items-center gap-2 pb-2 px-3 md:px-6 pt-3 md:pt-6">
              <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              <div>
                <CardDescription className="text-xs md:text-sm">Total Posts</CardDescription>
                <CardTitle className="text-lg md:text-xl">{stats.totalPosts}</CardTitle>
              </div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="flex-row items-center gap-2 pb-2 px-3 md:px-6 pt-3 md:pt-6">
              <Calendar className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
              <div>
                <CardDescription className="text-xs md:text-sm">Scheduled</CardDescription>
                <CardTitle className="text-lg md:text-xl">{stats.scheduledPosts}</CardTitle>
              </div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="flex-row items-center gap-2 pb-2 px-3 md:px-6 pt-3 md:pt-6">
              <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
              <div>
                <CardDescription className="text-xs md:text-sm truncate">Published Today</CardDescription>
                <CardTitle className="text-lg md:text-xl">{stats.publishedToday}</CardTitle>
              </div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="flex-row items-center gap-2 pb-2 px-3 md:px-6 pt-3 md:pt-6">
              <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
              <div>
                <CardDescription className="text-xs md:text-sm truncate">Total Engagement</CardDescription>
                <CardTitle className="text-lg md:text-xl">{stats.totalEngagement}</CardTitle>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <EnhancedTabs 
          defaultValue="composer" 
          className="space-y-6"
          tabs={[
            { 
              value: "composer", 
              label: "Composer", 
              icon: Edit3,
              badge: "New"
            },
            { 
              value: "calendar", 
              label: "Calendar", 
              icon: Calendar,
              badge: stats.scheduledPosts > 0 ? `${stats.scheduledPosts}` : undefined
            },
            { 
              value: "analytics", 
              label: "Analytics", 
              icon: Activity,
              badge: stats.totalEngagement > 0 ? `${stats.totalEngagement}` : undefined
            },
            { 
              value: "templates", 
              label: "Templates", 
              icon: FileText,
              badge: "Pro"
            }
          ]}
        >

          <TabsContent value="composer">
            <SocialMediaComposer onPostCreated={fetchPosts} />
          </TabsContent>

          <TabsContent value="calendar">
            <SocialMediaCalendar posts={posts} onPostsChange={fetchPosts} />
          </TabsContent>

          <TabsContent value="analytics">
            <SocialMediaAnalytics posts={posts} />
          </TabsContent>

          <TabsContent value="templates">
            <SocialMediaTemplates />
          </TabsContent>
        </EnhancedTabs>

        {/* Recent Posts */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Posts</CardTitle>
            <CardDescription>Your latest social media activity</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading posts...</div>
            ) : posts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No posts yet. Create your first social media post!
              </div>
            ) : (
              <div className="space-y-4">
                {posts.slice(0, 5).map((post) => (
                  <div key={post.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="text-2xl">{getPlatformIcon(post.platform)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getStatusColor(post.status)}>
                          {getStatusIcon(post.status)}
                          <span className="ml-1 capitalize">{post.status}</span>
                        </Badge>
                        <span className="text-sm text-muted-foreground capitalize">
                          {post.platform}
                        </span>
                      </div>
                      <p className="text-sm line-clamp-2 mb-2">{post.post_content}</p>
                      <div className="text-xs text-muted-foreground">
                        {post.scheduled_at && (
                          <span>Scheduled: {new Date(post.scheduled_at).toLocaleString()}</span>
                        )}
                        {post.posted_at && (
                          <span>Posted: {new Date(post.posted_at).toLocaleString()}</span>
                        )}
                        {!post.scheduled_at && !post.posted_at && (
                          <span>Created: {new Date(post.created_at).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
};

export default SocialMediaManager;