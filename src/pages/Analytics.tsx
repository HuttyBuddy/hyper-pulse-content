import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import AppHeader from "@/components/layout/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancedTabs, TabsContent } from "@/components/ui/enhanced-tabs";
import { BarChart3, TrendingUp, Users, DollarSign, Target, Mail, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import LeadFunnelChart from "@/components/analytics/LeadFunnelChart";
import ROIDashboard from "@/components/analytics/ROIDashboard";
import LeadManagement from "@/components/analytics/LeadManagement";
import NewsletterManagement from "@/components/analytics/NewsletterManagement";
import { useIsMobile } from "@/hooks/use-mobile";

interface AnalyticsData {
  totalLeads: number;
  totalRevenue: number;
  conversionRate: number;
  avgLeadValue: number;
  contentViews: number;
  emailSubscribers: number;
}

const Analytics = () => {
  const isMobile = useIsMobile();
  const [selectedTab, setSelectedTab] = useState("overview");
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
      
      <main className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className={`font-bold tracking-tight flex items-center gap-2 ${isMobile ? 'text-2xl flex-col items-start' : 'text-3xl'}`}>
            <div className="flex items-center gap-2">
              <BarChart3 className={`text-primary ${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`} />
              {isMobile ? 'Analytics & ROI' : 'Analytics & ROI Dashboard'}
            </div>
          </h1>
          <p className={`text-muted-foreground mt-2 ${isMobile ? 'text-sm' : ''}`}>
            Track your marketing performance, lead generation, and return on investment
          </p>
        </div>

        {/* Key Metrics Overview */}
        <div className={`grid gap-3 md:gap-4 mb-6 md:mb-8 ${isMobile ? 'grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
          <Card>
            <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${isMobile ? 'pb-1 px-3 pt-3' : 'pb-2'}`}>
              <CardTitle className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className={isMobile ? 'px-3 pb-3' : ''}>
              <div className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>{loading ? "..." : analyticsData.totalLeads}</div>
              <p className="text-xs text-muted-foreground">
                {isMobile ? 'This period' : 'Generated this period'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${isMobile ? 'pb-1 px-3 pt-3' : 'pb-2'}`}>
              <CardTitle className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className={isMobile ? 'px-3 pb-3' : ''}>
              <div className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                {loading ? "..." : `$${isMobile && analyticsData.totalRevenue > 999 ? `${(analyticsData.totalRevenue/1000).toFixed(0)}k` : analyticsData.totalRevenue.toLocaleString()}`}
              </div>
              <p className="text-xs text-muted-foreground">
                {isMobile ? 'Converted' : 'From converted leads'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${isMobile ? 'pb-1 px-3 pt-3' : 'pb-2'}`}>
              <CardTitle className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>Conversion</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className={isMobile ? 'px-3 pb-3' : ''}>
              <div className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                {loading ? "..." : `${analyticsData.conversionRate.toFixed(1)}%`}
              </div>
              <p className="text-xs text-muted-foreground">
                {isMobile ? 'Rate' : 'Lead to customer conversion'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${isMobile ? 'pb-1 px-3 pt-3' : 'pb-2'}`}>
              <CardTitle className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>Avg Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className={isMobile ? 'px-3 pb-3' : ''}>
              <div className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                {loading ? "..." : `$${isMobile && analyticsData.avgLeadValue > 999 ? `${(analyticsData.avgLeadValue/1000).toFixed(0)}k` : analyticsData.avgLeadValue.toFixed(0)}`}
              </div>
              <p className="text-xs text-muted-foreground">
                {isMobile ? 'Per lead' : 'Per lead generated'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Analytics Tabs */}
        <EnhancedTabs 
          value={selectedTab} 
          onValueChange={setSelectedTab}
          tabs={[
            { 
              value: "overview", 
              label: "Overview", 
              icon: BarChart3,
              badge: analyticsData.totalLeads > 0 ? `${analyticsData.totalLeads}` : undefined
            },
            { 
              value: "funnel", 
              label: "Funnel", 
              icon: TrendingUp,
              badge: analyticsData.conversionRate > 0 ? `${analyticsData.conversionRate.toFixed(0)}%` : undefined
            },
            { 
              value: "roi", 
              label: "ROI", 
              icon: DollarSign,
              badge: analyticsData.totalRevenue > 0 ? `$${analyticsData.totalRevenue > 999 ? `${(analyticsData.totalRevenue/1000).toFixed(0)}k` : analyticsData.totalRevenue.toFixed(0)}` : undefined
            },
            { 
              value: "leads", 
              label: "Leads", 
              icon: Users,
              badge: analyticsData.totalLeads > 0 ? "Active" : undefined
            },
            { 
              value: "email", 
              label: "Email", 
              icon: Mail,
              badge: analyticsData.emailSubscribers > 0 ? `${analyticsData.emailSubscribers}` : undefined
            }
          ]}
        >

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
        </EnhancedTabs>
      </main>
    </div>
  );
};

export default Analytics;