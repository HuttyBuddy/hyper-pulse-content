import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import AppHeader from "@/components/layout/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { format } from "date-fns";
import { 
  MapPin, 
  Calendar, 
  TrendingUp, 
  Home, 
  DollarSign, 
  Clock,
  Sparkles,
  RefreshCw,
  Edit,
  Share2,
  Download,
  BarChart3,
  Users,
  Target
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { FirstContentCelebration } from "@/components/content/FirstContentCelebration";
import { useContentHistory } from "@/hooks/use-content-history";

interface MarketData {
  median_sale_price: number | null;
  avg_price_per_sqft: number | null;
  days_on_market: number | null;
  active_listings: number | null;
  new_listings: number | null;
  closed_sales: number | null;
  months_of_inventory: number | null;
  mom_change: any;
  yoy_change: any;
  report_date: string;
  neighborhood: string;
  county: string;
  state: string;
}

interface ContentData {
  blogContent: string;
  socialPosts: string[];
  newsletterDraft: string;
  lifestyleGuide: string;
}

const ContentPackage = () => {
  const { slugDate } = useParams<{ slugDate: string }>();
  const navigate = useNavigate();
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [contentData, setContentData] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const { saveToHistory } = useContentHistory();

  // Parse the slug to extract neighborhood and date
  const parseSlugDate = (slugDate: string) => {
    const parts = slugDate.split('-');
    if (parts.length < 4) return null;
    
    const date = parts.slice(-3).join('-'); // Last 3 parts are the date
    const neighborhood = parts.slice(0, -3).join('-'); // Everything before is neighborhood
    
    return { neighborhood, date };
  };

  useEffect(() => {
    if (slugDate) {
      const parsed = parseSlugDate(slugDate);
      if (parsed) {
        loadOrGenerateContent(parsed.neighborhood, parsed.date);
      } else {
        setError("Invalid content URL format");
        setLoading(false);
      }
    }
  }, [slugDate]);

  const loadOrGenerateContent = async (neighborhoodSlug: string, date: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      // First, try to load existing market data
      const { data: existingMarketData } = await supabase
        .from('market_reports')
        .select('*')
        .eq('user_id', user.id)
        .eq('neighborhood_slug', neighborhoodSlug)
        .eq('report_date', date)
        .maybeSingle();

      if (existingMarketData) {
        setMarketData(existingMarketData);
        
        // Check if we have existing content for this date
        const { data: existingContent } = await supabase
          .from('content_history')
          .select('*')
          .eq('user_id', user.id)
          .eq('neighborhood', existingMarketData.neighborhood)
          .eq('report_date', date)
          .eq('content_type', 'blog')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingContent) {
          // We have existing content, display it
          setContentData({
            blogContent: existingContent.content,
            socialPosts: [],
            newsletterDraft: existingContent.content,
            lifestyleGuide: ""
          });
          setLoading(false);
          return;
        }
      }

      // No existing content, need to generate new content
      await generateFreshContent(neighborhoodSlug, date);

    } catch (error: any) {
      console.error('Error loading content:', error);
      setError(error.message || 'Failed to load content');
      setLoading(false);
    }
  };

  const generateFreshContent = async (neighborhoodSlug: string, date: string) => {
    try {
      setGenerating(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's profile to get the full neighborhood info
      const { data: profile } = await supabase
        .from('profiles')
        .select('neighborhood, county, state')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile?.neighborhood) {
        toast("Please complete your profile setup first");
        navigate('/profile');
        return;
      }

      // Step 1: Fetch/refresh market data
      toast("Fetching latest market data...");
      
      try {
        await supabase.functions.invoke('fetch-market-data', {
          body: {
            neighborhood: profile.neighborhood,
            county: profile.county,
            state: profile.state,
            neighborhood_slug: neighborhoodSlug
          }
        });
      } catch (marketError) {
        console.warn('Market data fetch failed, continuing with existing data:', marketError);
      }

      // Step 2: Get the market data we just fetched/updated
      const { data: marketReport } = await supabase
        .from('market_reports')
        .select('*')
        .eq('user_id', user.id)
        .eq('neighborhood_slug', neighborhoodSlug)
        .eq('report_date', date)
        .maybeSingle();

      if (marketReport) {
        setMarketData(marketReport);
      }

      // Step 3: Generate AI content
      toast("Generating your hyper-local content...");
      
      const { data: contentResponse, error: contentError } = await supabase.functions.invoke('generate-newsletter-content', {
        body: {
          neighborhood: profile.neighborhood,
          county: profile.county,
          state: profile.state
        }
      });

      if (contentError) {
        throw new Error(contentError.message || 'Content generation failed');
      }

      if (!contentResponse?.content) {
        throw new Error('No content was generated');
      }

      // Step 4: Save the generated content to history
      const contentTitle = `${profile.neighborhood} Market Pulse - ${format(new Date(date), 'MMMM d, yyyy')}`;
      
      await saveToHistory({
        contentType: 'blog',
        title: contentTitle,
        content: contentResponse.content,
        neighborhood: profile.neighborhood,
        county: profile.county,
        state: profile.state,
        reportDate: date,
        templateUsed: 'AI Market Analysis'
      });

      // Step 5: Set the content data
      setContentData({
        blogContent: contentResponse.content,
        socialPosts: [
          `🏠 ${profile.neighborhood} Market Update: ${marketReport?.median_sale_price ? `Median home price: $${marketReport.median_sale_price.toLocaleString()}` : 'Strong market activity continues'} ${marketReport?.days_on_market ? `• Avg days on market: ${marketReport.days_on_market}` : ''} #RealEstate #${profile.neighborhood.replace(/\s+/g, '')}`,
          `📊 Market Insight: ${profile.neighborhood} shows ${marketReport?.months_of_inventory ? `${marketReport.months_of_inventory} months of inventory` : 'balanced market conditions'}. ${marketReport?.months_of_inventory && marketReport.months_of_inventory < 3 ? "Great time for sellers!" : marketReport?.months_of_inventory && marketReport.months_of_inventory > 6 ? "Opportunities for buyers!" : "Balanced market for all!"} #MarketUpdate`,
          `🌟 Why I love ${profile.neighborhood}: Perfect blend of community charm and modern convenience. Thinking of making a move? Let's chat about your options! #${profile.neighborhood.replace(/\s+/g, '')}Life #RealEstate`,
          `💡 Pro Tip: In today's ${profile.neighborhood} market, ${marketReport?.days_on_market && marketReport.days_on_market < 30 ? 'well-priced homes are moving quickly. Get pre-approved and be ready to act!' : 'buyers have more time to make thoughtful decisions. Take advantage of the selection!'} #RealEstateTips`,
          `📈 ${profile.neighborhood} Market Snapshot: ${marketReport?.active_listings ? `${marketReport.active_listings} active listings` : 'Active market'} ${marketReport?.new_listings ? `• ${marketReport.new_listings} new this month` : ''} ${marketReport?.closed_sales ? `• ${marketReport.closed_sales} recent sales` : ''} #MarketData`
        ],
        newsletterDraft: contentResponse.content,
        lifestyleGuide: `Discover what makes ${profile.neighborhood} special - from local favorites to community events that bring neighbors together.`
      });

      // Check if this is their first content generation
      const { count } = await supabase
        .from('content_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (count && count <= 1) {
        setShowCelebration(true);
      }

      toast("Content generated successfully!");

    } catch (error: any) {
      console.error('Content generation error:', error);
      setError(error.message || 'Failed to generate content');
      toast(`Content generation failed: ${error.message}`);
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  const handleRefreshContent = () => {
    if (slugDate) {
      const parsed = parseSlugDate(slugDate);
      if (parsed) {
        generateFreshContent(parsed.neighborhood, parsed.date);
      }
    }
  };

  const handleEditContent = () => {
    navigate('/editor');
  };

  const handleShareContent = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-shareable-report', {
        body: {
          reportType: 'content_package',
          title: `${marketData?.neighborhood} Market Report`,
          description: 'Professional market analysis and insights',
          expiresInDays: 30
        }
      });

      if (error) throw error;

      if (data?.shareUrl) {
        navigator.clipboard.writeText(data.shareUrl);
        toast("Shareable link copied to clipboard!");
      }
    } catch (error: any) {
      console.error('Error generating shareable report:', error);
      toast("Failed to create shareable link");
    }
  };

  if (loading || generating) {
    return (
      <>
        <Helmet>
          <title>Generating Content — Hyper Pulse Content</title>
        </Helmet>
        <AppHeader />
        <main className="container px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
              <CardContent className="py-12 text-center">
                <div className="space-y-6">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-2">
                      {generating ? "Generating Your Content..." : "Loading Content Package..."}
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      {generating 
                        ? "Creating hyper-local market analysis with real data" 
                        : "Preparing your content package"
                      }
                    </p>
                    <LoadingSpinner size="lg" />
                  </div>
                  {generating && (
                    <div className="bg-background/50 p-4 rounded-lg max-w-md mx-auto">
                      <h3 className="font-medium text-sm mb-2">What we're creating for you:</h3>
                      <ul className="text-sm text-muted-foreground space-y-1 text-left">
                        <li>• Professional market analysis blog post</li>
                        <li>• 5 ready-to-post social media updates</li>
                        <li>• Newsletter draft with real market data</li>
                        <li>• Lifestyle insights for your area</li>
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Helmet>
          <title>Content Error — Hyper Pulse Content</title>
        </Helmet>
        <AppHeader />
        <main className="container px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Alert variant="destructive">
              <AlertDescription className="space-y-4">
                <div>
                  <h3 className="font-semibold">Content Generation Failed</h3>
                  <p>{error}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => navigate('/dashboard')}>
                    Back to Dashboard
                  </Button>
                  <Button onClick={handleRefreshContent}>
                    Try Again
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </main>
      </>
    );
  }

  if (!marketData || !contentData) {
    return (
      <>
        <Helmet>
          <title>Content Not Found — Hyper Pulse Content</title>
        </Helmet>
        <AppHeader />
        <main className="container px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="py-12 text-center">
                <h2 className="text-xl font-semibold mb-4">Content Package Not Found</h2>
                <p className="text-muted-foreground mb-6">
                  This content package doesn't exist or hasn't been generated yet.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={() => navigate('/dashboard')}>
                    Back to Dashboard
                  </Button>
                  <Button onClick={handleRefreshContent}>
                    Generate Content
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{marketData.neighborhood} Market Pulse — Hyper Pulse Content</title>
        <meta name="description" content={`Professional market analysis and insights for ${marketData.neighborhood}, ${marketData.state}`} />
      </Helmet>
      
      <AppHeader />
      
      <main className="container px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* First Content Celebration */}
          {showCelebration && (
            <FirstContentCelebration 
              neighborhood={marketData.neighborhood}
              onDismiss={() => setShowCelebration(false)}
            />
          )}

          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">
                {marketData.neighborhood} Market Pulse
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {marketData.neighborhood}, {marketData.county}, {marketData.state}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(marketData.report_date), 'MMMM d, yyyy')}
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleRefreshContent} disabled={generating}>
                <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
              <Button variant="outline" onClick={handleEditContent}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Content
              </Button>
              <Button variant="outline" onClick={handleShareContent}>
                <Share2 className="h-4 w-4 mr-2" />
                Share Report
              </Button>
            </div>
          </div>

          {/* Market Data Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Median Sale Price</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {marketData.median_sale_price 
                    ? `$${marketData.median_sale_price.toLocaleString()}`
                    : 'N/A'
                  }
                </div>
                <p className="text-xs text-muted-foreground">Current market median</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Days on Market</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {marketData.days_on_market || 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">Average selling time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {marketData.active_listings || 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">Currently for sale</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Price per Sq Ft</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {marketData.avg_price_per_sqft 
                    ? `$${marketData.avg_price_per_sqft}`
                    : 'N/A'
                  }
                </div>
                <p className="text-xs text-muted-foreground">Average pricing</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Blog Content */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Market Analysis Blog Post
                      </CardTitle>
                      <CardDescription>
                        Professional market analysis ready for your blog or newsletter
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">Ready to Publish</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {contentData.blogContent}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-6 pt-4 border-t">
                    <Button variant="outline" size="sm" onClick={handleEditContent}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      navigator.clipboard.writeText(contentData.blogContent);
                      toast("Blog content copied to clipboard!");
                    }}>
                      <Download className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Social Media Posts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Social Media Posts
                  </CardTitle>
                  <CardDescription>
                    Ready-to-use social media content for all platforms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {contentData.socialPosts.map((post, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-sm flex-1">{post}</p>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(post);
                              toast(`Social post ${index + 1} copied!`);
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" onClick={handleEditContent}>
                    <Edit className="h-4 w-4 mr-2" />
                    Customize & Brand
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleShareContent}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share with Client
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <a href="/social-media">
                      <Users className="h-4 w-4 mr-2" />
                      Schedule Social Posts
                    </a>
                  </Button>
                </CardContent>
              </Card>

              {/* Market Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Key Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {marketData.months_of_inventory && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Market Type:</span>
                        <Badge variant={
                          marketData.months_of_inventory < 3 ? "default" : 
                          marketData.months_of_inventory > 6 ? "secondary" : "outline"
                        }>
                          {marketData.months_of_inventory < 3 ? "Seller's Market" :
                           marketData.months_of_inventory > 6 ? "Buyer's Market" : "Balanced"}
                        </Badge>
                      </div>
                    )}
                    
                    {marketData.days_on_market && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Market Speed:</span>
                        <Badge variant={marketData.days_on_market < 30 ? "default" : "secondary"}>
                          {marketData.days_on_market < 30 ? "Fast" : "Moderate"}
                        </Badge>
                      </div>
                    )}

                    {marketData.mom_change && typeof marketData.mom_change === 'object' && (
                      <div className="space-y-2">
                        <span className="text-sm font-medium">Month-over-Month:</span>
                        {marketData.mom_change.price && (
                          <div className="flex items-center justify-between text-sm">
                            <span>Price Change:</span>
                            <span className={marketData.mom_change.price > 0 ? "text-green-600" : "text-red-600"}>
                              {marketData.mom_change.price > 0 ? '+' : ''}{marketData.mom_change.price}%
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Content Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Content Package</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Blog Post:</span>
                    <Badge variant="default">Ready</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Social Posts:</span>
                    <Badge variant="default">{contentData.socialPosts.length} Posts</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Newsletter:</span>
                    <Badge variant="default">Draft Ready</Badge>
                  </div>
                  <Separator />
                  <div className="text-xs text-muted-foreground">
                    Generated: {format(new Date(), 'h:mm a')}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default ContentPackage;