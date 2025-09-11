import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { FunnelChart, Funnel, ResponsiveContainer, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { TrendingDown, Users, UserCheck, DollarSign, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useIsMobile } from "@/hooks/use-mobile";

interface FunnelData {
  name: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}

interface LeadStats {
  visitors: number;
  leads: number;
  qualified: number;
  converted: number;
  leadSubmissions: number;
  crmSynced: number;
}

const LeadFunnelChart = () => {
  const isMobile = useIsMobile();
  const [funnelData, setFunnelData] = useState<FunnelData[]>([]);
  const [leadStats, setLeadStats] = useState<LeadStats>({
    visitors: 0,
    leads: 0,
    qualified: 0,
    converted: 0,
    leadSubmissions: 0,
    crmSynced: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFunnelData();
  }, []);

  const fetchFunnelData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch content performance for visitor data
      const { data: contentData } = await supabase
        .from('content_performance')
        .select('unique_visitors, leads_generated')
        .eq('user_id', user.id);

      // Fetch lead generation data
      const { data: leadData } = await supabase
        .from('lead_generation_tracking')
        .select('status')
        .eq('user_id', user.id);

      // Fetch lead submissions data
      const { data: submissionData } = await supabase
        .from('lead_submissions')
        .select('status, lead_score, utm_source')
        .eq('user_id', user.id);

      const totalVisitors = contentData?.reduce((sum, item) => sum + (item.unique_visitors || 0), 0) || 0;
      const totalLeads = leadData?.length || 0;
      const totalSubmissions = submissionData?.length || 0;
      const qualifiedLeads = leadData?.filter(lead => 
        ['qualified', 'converted'].includes(lead.status)
      ).length || 0;
      const convertedLeads = leadData?.filter(lead => lead.status === 'converted').length || 0;
      const crmSyncedLeads = submissionData?.filter(sub => sub.utm_source).length || 0;

      const stats = {
        visitors: Math.max(totalVisitors, totalLeads * 10), // Estimate if no visitor data
        leads: totalLeads,
        leadSubmissions: totalSubmissions,
        qualified: qualifiedLeads,
        converted: convertedLeads,
        crmSynced: crmSyncedLeads
      };

      setLeadStats(stats);

      // Create funnel data
      const funnelSteps = [
        {
          name: "Website Visitors",
          value: stats.visitors,
          color: "hsl(var(--muted))",
          icon: <Users className="h-4 w-4" />
        },
        {
          name: "Leads Generated",
          value: stats.leads,
          color: "hsl(var(--primary))",
          icon: <Target className="h-4 w-4" />
        },
        {
          name: "Form Submissions",
          value: stats.leadSubmissions,
          color: "hsl(var(--secondary))",
          icon: <UserCheck className="h-4 w-4" />
        },
        {
          name: "Qualified Leads",
          value: stats.qualified,
          color: "hsl(var(--accent))",
          icon: <UserCheck className="h-4 w-4" />
        },
        {
          name: "Converted Customers",
          value: stats.converted,
          color: "hsl(var(--primary))",
          icon: <DollarSign className="h-4 w-4" />
        }
      ];

      setFunnelData(funnelSteps);
    } catch (error) {
      console.error('Error fetching funnel data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateConversionRate = (current: number, previous: number) => {
    return previous > 0 ? ((current / previous) * 100).toFixed(1) : '0.0';
  };

  if (loading) {
    return <div className="text-center py-8">Loading funnel data...</div>;
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Lead Generation Funnel
          </CardTitle>
          <CardDescription>
            Track your lead conversion journey from visitors to customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              visitors: { label: "Visitors", color: "hsl(var(--muted))" },
              leads: { label: "Leads", color: "hsl(var(--primary))" },
              qualified: { label: "Qualified", color: "hsl(var(--secondary))" },
              converted: { label: "Converted", color: "hsl(var(--accent))" },
            }}
            className={isMobile ? "h-[300px]" : "h-[400px]"}
          >
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Funnel
                  dataKey="value"
                  data={funnelData}
                  isAnimationActive
                >
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Funnel>
                <ChartTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload[0]) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-card p-3 rounded-lg shadow-lg border">
                          <div className="flex items-center gap-2 font-medium">
                            {data.icon}
                            {data.name}
                          </div>
                          <div className="text-2xl font-bold text-primary">
                            {data.value.toLocaleString()}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </FunnelChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Conversion Rate Breakdown */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-4'}`}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Visitor to Lead</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {calculateConversionRate(leadStats.leads, leadStats.visitors)}%
            </div>
            <Progress 
              value={parseFloat(calculateConversionRate(leadStats.leads, leadStats.visitors))} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {leadStats.leads} of {leadStats.visitors} visitors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Lead to Submission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {calculateConversionRate(leadStats.leadSubmissions, leadStats.leads)}%
            </div>
            <Progress 
              value={parseFloat(calculateConversionRate(leadStats.leadSubmissions, leadStats.leads))} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {leadStats.leadSubmissions} detailed submissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Lead to Qualified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {calculateConversionRate(leadStats.qualified, leadStats.leads)}%
            </div>
            <Progress 
              value={parseFloat(calculateConversionRate(leadStats.qualified, leadStats.leads))} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {leadStats.qualified} of {leadStats.leads} leads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Qualified to Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {calculateConversionRate(leadStats.converted, leadStats.qualified)}%
            </div>
            <Progress 
              value={parseFloat(calculateConversionRate(leadStats.converted, leadStats.qualified))} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {leadStats.converted} of {leadStats.qualified} qualified
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeadFunnelChart;