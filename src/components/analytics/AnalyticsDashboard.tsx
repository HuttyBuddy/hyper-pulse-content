import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Eye, Share2, Download } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ContentMetrics {
  name: string;
  views: number;
  leads: number;
  revenue: number;
  date: string;
}

interface ChannelPerformance {
  channel: string;
  leads: number;
  conversion: number;
  color: string;
}

const CHANNEL_COLORS = {
  'blog_post': 'hsl(var(--primary))',
  'social_media': 'hsl(var(--secondary))',
  'email_campaign': 'hsl(var(--accent))',
  'direct': 'hsl(var(--muted))'
};

const AnalyticsDashboard = () => {
  const isMobile = useIsMobile();
  const [contentMetrics, setContentMetrics] = useState<ContentMetrics[]>([]);
  const [channelPerformance, setChannelPerformance] = useState<ChannelPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch content performance over time
      const { data: contentData } = await supabase
        .from('content_performance')
        .select(`
          page_views,
          leads_generated,
          revenue_attributed,
          date_recorded,
          content_history!inner(title)
        `)
        .eq('user_id', user.id)
        .order('date_recorded', { ascending: true })
        .limit(30);

      // Fetch lead generation by channel
      const { data: leadData } = await supabase
        .from('lead_generation_tracking')
        .select('lead_medium, status')
        .eq('user_id', user.id);

      // Process content metrics
      if (contentData) {
        const metrics = contentData.map(item => ({
          name: item.content_history.title.substring(0, 20) + '...',
          views: item.page_views || 0,
          leads: item.leads_generated || 0,
          revenue: item.revenue_attributed || 0,
          date: new Date(item.date_recorded).toLocaleDateString()
        }));
        setContentMetrics(metrics);
      }

      // Process channel performance
      if (leadData) {
        const channelStats = leadData.reduce((acc, lead) => {
          const channel = lead.lead_medium || 'direct';
          if (!acc[channel]) {
            acc[channel] = { total: 0, converted: 0 };
          }
          acc[channel].total++;
          if (lead.status === 'converted') {
            acc[channel].converted++;
          }
          return acc;
        }, {} as Record<string, { total: number; converted: number }>);

        const channelData = Object.entries(channelStats).map(([channel, stats]) => ({
          channel,
          leads: stats.total,
          conversion: stats.total > 0 ? (stats.converted / stats.total) * 100 : 0,
          color: CHANNEL_COLORS[channel as keyof typeof CHANNEL_COLORS] || 'hsl(var(--muted))'
        }));

        setChannelPerformance(channelData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading analytics data...</div>;
  }

  return (
    <div className="grid gap-6">
      {/* Content Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Content Performance Over Time
          </CardTitle>
          <CardDescription>
            Track how your content generates views, leads, and revenue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              views: { label: "Page Views", color: "hsl(var(--primary))" },
              leads: { label: "Leads Generated", color: "hsl(var(--secondary))" },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={contentMetrics}>
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="views" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="leads" 
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2'}`}>
        {/* Channel Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Lead Sources
            </CardTitle>
            <CardDescription>
              Which channels generate the most leads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                leads: { label: "Leads", color: "hsl(var(--primary))" }
              }}
              className="h-[250px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelPerformance}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="leads"
                    nameKey="channel"
                  >
                    {channelPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Conversion Rates by Channel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Conversion Rates
            </CardTitle>
            <CardDescription>
              How well each channel converts leads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
            config={{
              conversion: { label: "Conversion %", color: "hsl(var(--primary))" }
            }}
            className={isMobile ? "h-[200px]" : "h-[250px]"}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channelPerformance}>
                  <XAxis dataKey="channel" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="conversion" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;