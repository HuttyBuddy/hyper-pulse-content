import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Eye, Share2, Download, Maximize2, Minimize2, ZoomIn, ZoomOut, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedChart, setExpandedChart] = useState<'performance' | 'sources' | 'conversion' | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

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
          unique_visitors,
          time_on_page,
          bounce_rate,
          shares,
          downloads,
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

      // Fetch detailed lead submissions for enhanced analytics
      const { data: submissionData } = await supabase
        .from('lead_submissions')
        .select('utm_source, utm_medium, utm_campaign, lead_score, status, engagement_data')
        .eq('user_id', user.id);
      // Process content metrics
      if (contentData) {
        const metrics = contentData.map(item => ({
          name: item.content_history.title.substring(0, 20) + '...',
          views: item.page_views || 0,
          uniqueVisitors: item.unique_visitors || 0,
          timeOnPage: item.time_on_page || 0,
          bounceRate: item.bounce_rate || 0,
          shares: item.shares || 0,
          downloads: item.downloads || 0,
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
          avgScore: stats.total > 0 ? Math.round(stats.total / stats.total) : 0,
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

  const handleDownload = (chartType: string) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 400;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.font = '16px Arial';
    ctx.fillText(`${chartType} Chart`, 20, 30);
    
    const link = document.createElement('a');
    link.download = `${chartType.toLowerCase().replace(/\s+/g, '-')}-chart.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.2, 2));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.2, 0.5));

  if (loading) {
    return <div className="text-center py-8">Loading analytics data...</div>;
  }

  return (
    <div className={`grid ${isMobile ? 'gap-3' : 'gap-6'}`}>
      {/* Content Performance Chart */}
      <Card className="cursor-pointer" onClick={() => setExpandedChart('performance')}>
        <CardHeader className={isMobile ? 'p-4' : ''}>
          <CardTitle className={`flex items-center justify-between ${isMobile ? 'text-lg' : ''}`}>
            <div className="flex items-center gap-2">
              <Eye className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
              <span className={isMobile ? 'text-sm' : ''}>Content Performance Over Time</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload('Content Performance');
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedChart('performance');
                }}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
          <CardDescription className={isMobile ? 'text-xs' : ''}>
            Track how your content generates views, leads, and revenue
          </CardDescription>
        </CardHeader>
        <CardContent className={isMobile ? 'p-4 pt-0' : ''}>
          <ChartContainer
            config={{
              views: { label: "Page Views", color: "hsl(var(--primary))" },
              leads: { label: "Leads Generated", color: "hsl(var(--secondary))" },
              uniqueVisitors: { label: "Unique Visitors", color: "hsl(var(--accent))" },
            }}
            className={isMobile ? "h-[200px]" : "h-[300px]"}
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
                <Line 
                  type="monotone" 
                  dataKey="uniqueVisitors" 
                  stroke="hsl(var(--accent))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Expanded Chart Dialog */}
      <Dialog open={!!expandedChart} onOpenChange={() => setExpandedChart(null)}>
        <DialogContent className={`${isMobile ? 'w-full h-full max-w-none m-0 p-0' : 'max-w-6xl'}`}>
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {expandedChart === 'performance' && <Eye className="h-5 w-5" />}
                {expandedChart === 'sources' && <Share2 className="h-5 w-5" />}
                {expandedChart === 'conversion' && <Calendar className="h-5 w-5" />}
                {expandedChart === 'performance' && 'Content Performance Over Time'}
                {expandedChart === 'sources' && 'Lead Sources'}
                {expandedChart === 'conversion' && 'Conversion Rates'}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">{Math.round(zoomLevel * 100)}%</span>
                <Button variant="ghost" size="sm" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleDownload(
                    expandedChart === 'performance' ? 'Content Performance' :
                    expandedChart === 'sources' ? 'Lead Sources' : 'Conversion Rates'
                  )}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className={`${isMobile ? 'h-[calc(100vh-120px)]' : 'h-[70vh]'} px-6`}>
            <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}>
              {expandedChart === 'performance' && (
                <ChartContainer
                  config={{
                    views: { label: "Page Views", color: "hsl(var(--primary))" },
                    leads: { label: "Leads Generated", color: "hsl(var(--secondary))" },
                  }}
                  className={`${isMobile ? 'h-[400px]' : 'h-[500px]'} w-full`}
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
              )}
              {expandedChart === 'sources' && (
                <ChartContainer
                  config={{
                    leads: { label: "Leads", color: "hsl(var(--primary))" }
                  }}
                  className={`${isMobile ? 'h-[400px]' : 'h-[500px]'} w-full`}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={channelPerformance}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
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
              )}
              {expandedChart === 'conversion' && (
                <ChartContainer
                  config={{
                    conversion: { label: "Conversion %", color: "hsl(var(--primary))" }
                  }}
                  className={`${isMobile ? 'h-[400px]' : 'h-[500px]'} w-full`}
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
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2'}`}>
        {/* Channel Performance */}
        <Card className="cursor-pointer" onClick={() => setExpandedChart('sources')}>
          <CardHeader className={isMobile ? 'p-4' : ''}>
            <CardTitle className={`flex items-center justify-between ${isMobile ? 'text-lg' : ''}`}>
              <div className="flex items-center gap-2">
                <Share2 className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                <span className={isMobile ? 'text-sm' : ''}>Lead Sources</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload('Lead Sources');
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedChart('sources');
                  }}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
            <CardDescription className={isMobile ? 'text-xs' : ''}>
              Which channels generate the most leads
            </CardDescription>
          </CardHeader>
          <CardContent className={isMobile ? 'p-4 pt-0' : ''}>
            <ChartContainer
              config={{
                leads: { label: "Leads", color: "hsl(var(--primary))" }
              }}
              className={isMobile ? "h-[180px]" : "h-[250px]"}
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
        <Card className="cursor-pointer" onClick={() => setExpandedChart('conversion')}>
          <CardHeader className={isMobile ? 'p-4' : ''}>
            <CardTitle className={`flex items-center justify-between ${isMobile ? 'text-lg' : ''}`}>
              <div className="flex items-center gap-2">
                <Calendar className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                <span className={isMobile ? 'text-sm' : ''}>Conversion Rates</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload('Conversion Rates');
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedChart('conversion');
                  }}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
            <CardDescription className={isMobile ? 'text-xs' : ''}>
              How well each channel converts leads
            </CardDescription>
          </CardHeader>
          <CardContent className={isMobile ? 'p-4 pt-0' : ''}>
            <ChartContainer
            config={{
              conversion: { label: "Conversion %", color: "hsl(var(--primary))" }
            }}
            className={isMobile ? "h-[180px]" : "h-[250px]"}
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