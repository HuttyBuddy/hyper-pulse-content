import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import AppHeader from "@/components/layout/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Users, DollarSign, Target, Mail, Phone, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import LeadFunnelChart from "@/components/analytics/LeadFunnelChart";
import ROIDashboard from "@/components/analytics/ROIDashboard";
import LeadManagement from "@/components/analytics/LeadManagement";
import NewsletterManagement from "@/components/analytics/NewsletterManagement";

interface AnalyticsData {
  totalLeads: number;
  totalRevenue: number;
  conversionRate: number;
  avgLeadValue: number;
  contentViews: number;
  emailSubscribers: number;
}

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalLeads: 0,
    totalRevenue: 0,
    conversionRate: 0,
    avgLeadValue: 0,
    contentViews: 0,
    emailSubscribers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch leads data
      const { data: leads } = await supabase
        .from('lead_generation_tracking')
        .select('lead_value, status')
        .eq('user_id', user.id);

      // Fetch content performance data
      const { data: contentPerf } = await supabase
        .from('content_performance')
        .select('page_views, leads_generated, revenue_attributed')
        .eq('user_id', user.id);

      // Fetch newsletter subscribers
      const { data: subscribers } = await supabase
        .from('newsletter_subscribers')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      const totalLeads = leads?.length || 0;
      const convertedLeads = leads?.filter(l => l.status === 'converted').length || 0;
      const totalRevenue = leads?.reduce((sum, lead) => sum + (lead.lead_value || 0), 0) || 0;
      const contentViews = contentPerf?.reduce((sum, content) => sum + (content.page_views || 0), 0) || 0;

      setAnalyticsData({
        totalLeads,
        totalRevenue,
        conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
        avgLeadValue: totalLeads > 0 ? totalRevenue / totalLeads : 0,
        contentViews,
        emailSubscribers: subscribers?.length || 0
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Analytics & ROI Dashboard - Hyper-Local Pulse</title>
        <meta name="description" content="Track your real estate marketing ROI, lead generation, and content performance with comprehensive analytics." />
      </Helmet>
      
      <AppHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Analytics & ROI Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your marketing performance, lead generation, and return on investment
          </p>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : analyticsData.totalLeads}</div>
              <p className="text-xs text-muted-foreground">
                Generated this period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : `$${analyticsData.totalRevenue.toLocaleString()}`}
              </div>
              <p className="text-xs text-muted-foreground">
                From converted leads
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : `${analyticsData.conversionRate.toFixed(1)}%`}
              </div>
              <p className="text-xs text-muted-foreground">
                Lead to customer conversion
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Lead Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : `$${analyticsData.avgLeadValue.toFixed(0)}`}
              </div>
              <p className="text-xs text-muted-foreground">
                Per lead generated
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full lg:w-[600px] grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="funnel">Lead Funnel</TabsTrigger>
            <TabsTrigger value="roi">ROI Tracking</TabsTrigger>
            <TabsTrigger value="leads">Lead Management</TabsTrigger>
            <TabsTrigger value="email">Email Marketing</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="funnel">
            <LeadFunnelChart />
          </TabsContent>

          <TabsContent value="roi">
            <ROIDashboard />
          </TabsContent>

          <TabsContent value="leads">
            <LeadManagement />
          </TabsContent>

          <TabsContent value="email">
            <NewsletterManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Analytics;