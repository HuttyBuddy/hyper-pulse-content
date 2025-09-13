import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Users, Heart, MessageCircle, Share } from "lucide-react";

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

interface SocialMediaAnalyticsProps {
  posts: SocialMediaPost[];
}

export const SocialMediaAnalytics = ({ posts }: SocialMediaAnalyticsProps) => {
  const publishedPosts = posts.filter(post => post.status === 'posted' && post.posted_at);

  const calculateTotalEngagement = () => {
    return publishedPosts.reduce((total, post) => {
      const metrics = post.engagement_metrics || {};
      if (typeof metrics === 'object' && metrics !== null) {
        const likes = (metrics as any).likes || 0;
        const comments = (metrics as any).comments || 0;
        const shares = (metrics as any).shares || 0;
        return total + likes + comments + shares;
      }
      return total;
    }, 0);
  };

  const getEngagementByPlatform = () => {
    const platformStats = publishedPosts.reduce((acc, post) => {
      if (!acc[post.platform]) {
        acc[post.platform] = { posts: 0, engagement: 0 };
      }
      acc[post.platform].posts += 1;
      
      const metrics = post.engagement_metrics || {};
      if (typeof metrics === 'object' && metrics !== null) {
        const likes = (metrics as any).likes || 0;
        const comments = (metrics as any).comments || 0;
        const shares = (metrics as any).shares || 0;
        acc[post.platform].engagement += likes + comments + shares;
      }
      
      return acc;
    }, {} as Record<string, { posts: number; engagement: number }>);

    return Object.entries(platformStats).map(([platform, stats]) => ({
      platform,
      ...stats,
      avgEngagement: stats.posts > 0 ? Math.round(stats.engagement / stats.posts) : 0
    }));
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

  const totalEngagement = calculateTotalEngagement();
  const avgEngagement = publishedPosts.length > 0 ? Math.round(totalEngagement / publishedPosts.length) : 0;
  const platformStats = getEngagementByPlatform();

  const topPerformingPost = publishedPosts.reduce((top, post) => {
    const metrics = post.engagement_metrics || {};
    if (typeof metrics === 'object' && metrics !== null) {
      const engagement = ((metrics as any).likes || 0) + ((metrics as any).comments || 0) + ((metrics as any).shares || 0);
      const topEngagement = typeof top.engagement_metrics === 'object' && top.engagement_metrics !== null ?
        ((top.engagement_metrics as any).likes || 0) + ((top.engagement_metrics as any).comments || 0) + ((top.engagement_metrics as any).shares || 0) : 0;
      return engagement > topEngagement ? post : top;
    }
    return top;
  }, publishedPosts[0]);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex-row items-center gap-3 pb-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <div>
              <CardDescription>Total Posts</CardDescription>
              <CardTitle className="text-xl">{publishedPosts.length}</CardTitle>
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center gap-3 pb-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <div>
              <CardDescription>Total Engagement</CardDescription>
              <CardTitle className="text-xl">{totalEngagement}</CardTitle>
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center gap-3 pb-2">
            <Users className="h-5 w-5 text-blue-600" />
            <div>
              <CardDescription>Avg Engagement</CardDescription>
              <CardTitle className="text-xl">{avgEngagement}</CardTitle>
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center gap-3 pb-2">
            <Share className="h-5 w-5 text-purple-600" />
            <div>
              <CardDescription>Platforms</CardDescription>
              <CardTitle className="text-xl">{platformStats.length}</CardTitle>
            </div>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Performance</CardTitle>
            <CardDescription>Engagement breakdown by platform</CardDescription>
          </CardHeader>
          <CardContent>
            {platformStats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No published posts yet
              </div>
            ) : (
              <div className="space-y-4">
                {platformStats.map((stat) => (
                  <div key={stat.platform} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getPlatformIcon(stat.platform)}</span>
                      <div>
                        <div className="font-medium capitalize">{stat.platform}</div>
                        <div className="text-sm text-muted-foreground">
                          {stat.posts} post{stat.posts !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{stat.engagement}</div>
                      <div className="text-sm text-muted-foreground">
                        {stat.avgEngagement} avg
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Performing Post */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Post</CardTitle>
            <CardDescription>Your most engaging content</CardDescription>
          </CardHeader>
          <CardContent>
            {!topPerformingPost ? (
              <div className="text-center py-8 text-muted-foreground">
                No published posts yet
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getPlatformIcon(topPerformingPost.platform)}</span>
                  <div>
                    <Badge variant="secondary" className="capitalize">
                      {topPerformingPost.platform}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      {topPerformingPost.posted_at && 
                        new Date(topPerformingPost.posted_at).toLocaleDateString()
                      }
                    </div>
                  </div>
                </div>
                
                <p className="text-sm line-clamp-3 border-l-2 border-primary pl-3">
                  {topPerformingPost.post_content}
                </p>

                {typeof topPerformingPost.engagement_metrics === 'object' && 
                 topPerformingPost.engagement_metrics !== null && (
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4 text-red-500" />
                      <span>{(topPerformingPost.engagement_metrics as any).likes || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4 text-blue-500" />
                      <span>{(topPerformingPost.engagement_metrics as any).comments || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Share className="w-4 h-4 text-green-500" />
                      <span>{(topPerformingPost.engagement_metrics as any).shares || 0}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest published posts and their performance</CardDescription>
        </CardHeader>
        <CardContent>
          {publishedPosts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No published posts yet. Start creating content to see analytics!
            </div>
          ) : (
            <div className="space-y-4">
              {publishedPosts.slice(0, 5).map((post) => {
                const metrics = post.engagement_metrics || {};
                const totalEngagement = typeof metrics === 'object' && metrics !== null ?
                  ((metrics as any).likes || 0) + ((metrics as any).comments || 0) + ((metrics as any).shares || 0) : 0;
                
                return (
                  <div key={post.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <span className="text-2xl">{getPlatformIcon(post.platform)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="capitalize">
                          {post.platform}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {post.posted_at && new Date(post.posted_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm line-clamp-2 mb-2">{post.post_content}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Total: {totalEngagement} engagements</span>
                        {typeof metrics === 'object' && metrics !== null && (
                          <>
                            <span>{(metrics as any).likes || 0} likes</span>
                            <span>{(metrics as any).comments || 0} comments</span>
                            <span>{(metrics as any).shares || 0} shares</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};