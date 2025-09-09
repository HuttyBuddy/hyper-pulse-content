import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { TrendingUp, Home, Calendar, MapPin, Eye, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface DashboardData {
  dashboardInfo: {
    title: string;
    description: string;
    location: {
      neighborhood: string;
      county: string;
      state: string;
    };
    dateRange: {
      start: string;
      end: string;
    };
    viewCount: number;
    lastUpdated: string;
  };
  branding: {
    agentName: string;
    logoUrl: string;
    headshotUrl: string;
    brokerageLogoUrl: string;
  };
  analyticsData: {
    marketTrends?: any[];
    priceAnalysis?: any;
    inventoryLevels?: any;
    neighborhoodActivity?: any[];
    comparativeAnalysis?: any;
  };
  clientInfo: {
    name?: string;
    email?: string;
    propertyAddress?: string;
  };
}

const ClientDashboard = () => {
  const { shareUrl } = useParams<{ shareUrl: string }>();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shareUrl) {
      fetchDashboardData();
    }
  }, [shareUrl]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-shareable-analytics?token=${shareUrl}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch dashboard data');
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your market dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Dashboard Unavailable</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              This dashboard may have expired or the link may be invalid. 
              Please contact your real estate agent for a new link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { dashboardInfo, branding, analyticsData, clientInfo } = dashboardData;

  return (
    <>
      <Helmet>
        <title>{dashboardInfo.title} — Market Dashboard</title>
        <meta name="description" content={dashboardInfo.description} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {branding.logoUrl && (
                  <img 
                    src={branding.logoUrl} 
                    alt="Agent Logo" 
                    className="h-10 w-auto object-contain"
                  />
                )}
                <div>
                  <h1 className="text-xl font-bold text-primary">Market Intelligence Dashboard</h1>
                  <p className="text-sm text-muted-foreground">
                    Prepared by {branding.agentName || 'Your Real Estate Professional'}
                  </p>
                </div>
              </div>
              {branding.headshotUrl && (
                <img 
                  src={branding.headshotUrl} 
                  alt={branding.agentName} 
                  className="h-12 w-12 rounded-full object-cover border-2 border-primary/20"
                />
              )}
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 space-y-8">
          {/* Dashboard Info */}
          <Card className="bg-white/60 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">{dashboardInfo.title}</CardTitle>
                  <CardDescription className="text-base">
                    {dashboardInfo.description}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {dashboardInfo.viewCount} views
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{dashboardInfo.location.neighborhood}, {dashboardInfo.location.state}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>
                    {format(new Date(dashboardInfo.dateRange.start), 'MMM d')} - {format(new Date(dashboardInfo.dateRange.end), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span>Updated {format(new Date(dashboardInfo.lastUpdated), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client Info */}
          {clientInfo.name && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Prepared For</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{clientInfo.name}</p>
                  {clientInfo.propertyAddress && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      {clientInfo.propertyAddress}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Market Trends Chart */}
          {analyticsData.marketTrends && analyticsData.marketTrends.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Market Trends Over Time
                </CardTitle>
                <CardDescription>
                  Price and inventory trends in {dashboardInfo.location.neighborhood}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    medianPrice: { label: "Median Price", color: "hsl(var(--primary))" },
                    daysOnMarket: { label: "Days on Market", color: "hsl(var(--secondary))" },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData.marketTrends}>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line 
                        type="monotone" 
                        dataKey="medianPrice" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="daysOnMarket" 
                        stroke="hsl(var(--secondary))" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Price Analysis */}
          {analyticsData.priceAnalysis && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Neighborhood Pricing</CardTitle>
                  <CardDescription>{dashboardInfo.location.neighborhood} Market Analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Median Sale Price</p>
                      <p className="text-2xl font-bold text-primary">
                        ${analyticsData.priceAnalysis.neighborhood.median_sale_price?.toLocaleString() || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Price per Sq Ft</p>
                      <p className="text-2xl font-bold text-primary">
                        ${analyticsData.priceAnalysis.neighborhood.avg_price_per_sqft || 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  {analyticsData.priceAnalysis.comparison.priceDifference && (
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-sm">
                        <span className="font-medium">vs County Average: </span>
                        <span className={`font-bold ${
                          parseFloat(analyticsData.priceAnalysis.comparison.priceDifference) > 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {analyticsData.priceAnalysis.comparison.priceDifference}%
                        </span>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Market Activity</CardTitle>
                  <CardDescription>Current inventory and sales activity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Listings</p>
                      <p className="text-2xl font-bold">
                        {analyticsData.inventoryLevels?.active_listings || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Months of Inventory</p>
                      <p className="text-2xl font-bold">
                        {analyticsData.inventoryLevels?.months_of_inventory?.toFixed(1) || 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm">
                      <span className="font-medium">Market Balance: </span>
                      {analyticsData.inventoryLevels?.months_of_inventory 
                        ? analyticsData.inventoryLevels.months_of_inventory < 3 
                          ? "Seller's Market" 
                          : analyticsData.inventoryLevels.months_of_inventory > 6 
                            ? "Buyer's Market" 
                            : "Balanced Market"
                        : 'Analyzing...'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Neighborhood Activity */}
          {analyticsData.neighborhoodActivity && analyticsData.neighborhoodActivity.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Market Interest & Activity</CardTitle>
                <CardDescription>
                  Tracking market engagement and lead generation in your area
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    views: { label: "Market Views", color: "hsl(var(--primary))" },
                    leads: { label: "Inquiries", color: "hsl(var(--secondary))" },
                  }}
                  className="h-[250px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.neighborhoodActivity}>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="views" fill="hsl(var(--primary))" />
                      <Bar dataKey="leads" fill="hsl(var(--secondary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Key Insights */}
          <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
            <CardHeader>
              <CardTitle>Key Market Insights</CardTitle>
              <CardDescription>What this data means for you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analyticsData.priceAnalysis && (
                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Price Trends:</strong> {dashboardInfo.location.neighborhood} is currently 
                    {analyticsData.priceAnalysis.comparison.priceDifference 
                      ? ` ${parseFloat(analyticsData.priceAnalysis.comparison.priceDifference) > 0 ? 'outperforming' : 'underperforming'} the county average by ${Math.abs(parseFloat(analyticsData.priceAnalysis.comparison.priceDifference))}%`
                      : ' showing stable market conditions'
                    }.
                  </AlertDescription>
                </Alert>
              )}
              
              {analyticsData.inventoryLevels && (
                <Alert>
                  <Home className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Market Balance:</strong> With {analyticsData.inventoryLevels.months_of_inventory?.toFixed(1) || 'current'} months of inventory, 
                    this is {analyticsData.inventoryLevels.months_of_inventory 
                      ? analyticsData.inventoryLevels.months_of_inventory < 3 
                        ? 'a strong seller\'s market with limited inventory and competitive conditions'
                        : analyticsData.inventoryLevels.months_of_inventory > 6 
                          ? 'a buyer\'s market with good selection and negotiating power'
                          : 'a balanced market with fair conditions for both buyers and sellers'
                      : 'showing current market dynamics'}.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Footer with Agent Branding */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="py-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  {branding.headshotUrl && (
                    <img 
                      src={branding.headshotUrl} 
                      alt={branding.agentName} 
                      className="h-16 w-16 rounded-full object-cover border-2 border-primary/20"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">{branding.agentName}</h3>
                    <p className="text-muted-foreground">Real Estate Professional</p>
                    <p className="text-sm text-muted-foreground">
                      Serving {dashboardInfo.location.neighborhood} and surrounding areas
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {branding.brokerageLogoUrl && (
                    <img 
                      src={branding.brokerageLogoUrl} 
                      alt="Brokerage Logo" 
                      className="h-12 w-auto object-contain"
                    />
                  )}
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t text-center">
                <p className="text-xs text-muted-foreground">
                  This dashboard was generated by The Hyper-Local Pulse • 
                  Data current as of {format(new Date(dashboardInfo.lastUpdated), 'MMMM d, yyyy')} • 
                  For the most current market information, please contact your agent
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
};

export default ClientDashboard;