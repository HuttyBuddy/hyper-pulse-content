import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Area, AreaChart } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, TrendingUp, Calculator, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ROIData {
  campaign: string;
  cost: number;
  revenue: number;
  roi: number;
  leads: number;
  date: string;
}

interface ROIMetrics {
  totalCost: number;
  totalRevenue: number;
  overallROI: number;
  costPerLead: number;
  revenuePerLead: number;
}

const ROIDashboard = () => {
  const [roiData, setRoiData] = useState<ROIData[]>([]);
  const [metrics, setMetrics] = useState<ROIMetrics>({
    totalCost: 0,
    totalRevenue: 0,
    overallROI: 0,
    costPerLead: 0,
    revenuePerLead: 0
  });
  const [loading, setLoading] = useState(true);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    cost: '',
    type: 'content'
  });

  useEffect(() => {
    fetchROIData();
  }, []);

  const fetchROIData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch campaign performance data
      const { data: campaignData } = await supabase
        .from('campaign_performance')
        .select('*')
        .eq('user_id', user.id)
        .order('date_range_start', { ascending: true });

      if (campaignData) {
        const roiResults = campaignData.map(campaign => ({
          campaign: campaign.campaign_name,
          cost: campaign.cost || 0,
          revenue: campaign.revenue || 0,
          roi: campaign.roi || 0,
          leads: campaign.conversions || 0,
          date: new Date(campaign.date_range_start).toLocaleDateString()
        }));

        const totalCost = roiResults.reduce((sum, item) => sum + item.cost, 0);
        const totalRevenue = roiResults.reduce((sum, item) => sum + item.revenue, 0);
        const totalLeads = roiResults.reduce((sum, item) => sum + item.leads, 0);

        setRoiData(roiResults);
        setMetrics({
          totalCost,
          totalRevenue,
          overallROI: totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0,
          costPerLead: totalLeads > 0 ? totalCost / totalLeads : 0,
          revenuePerLead: totalLeads > 0 ? totalRevenue / totalLeads : 0
        });
      }
    } catch (error) {
      console.error('Error fetching ROI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCampaign = async () => {
    if (!newCampaign.name || !newCampaign.cost) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('campaign_performance')
        .insert({
          user_id: user.id,
          campaign_name: newCampaign.name,
          campaign_type: newCampaign.type,
          cost: parseFloat(newCampaign.cost),
          revenue: 0,
          roi: 0,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          date_range_start: new Date().toISOString().split('T')[0],
          date_range_end: new Date().toISOString().split('T')[0]
        });

      if (!error) {
        setNewCampaign({ name: '', cost: '', type: 'content' });
        fetchROIData();
      }
    } catch (error) {
      console.error('Error adding campaign:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading ROI data...</div>;
  }

  return (
    <div className="grid gap-6">
      {/* ROI Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Marketing spend</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall ROI</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.overallROI.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Return on investment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost per Lead</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.costPerLead.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Average acquisition cost</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ROI by Campaign */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign ROI Comparison</CardTitle>
            <CardDescription>
              Return on investment for each marketing campaign
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                roi: { label: "ROI %", color: "hsl(var(--primary))" }
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roiData}>
                  <XAxis dataKey="campaign" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="roi" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Cost vs Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Cost vs Revenue</CardTitle>
            <CardDescription>
              Investment and returns comparison by campaign
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                cost: { label: "Cost", color: "hsl(var(--destructive))" },
                revenue: { label: "Revenue", color: "hsl(var(--primary))" }
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={roiData}>
                  <XAxis dataKey="campaign" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area 
                    type="monotone" 
                    dataKey="cost" 
                    fill="hsl(var(--destructive))" 
                    fillOpacity={0.3}
                    stroke="hsl(var(--destructive))"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.3}
                    stroke="hsl(var(--primary))"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Add Campaign */}
      <Card>
        <CardHeader>
          <CardTitle>Add Marketing Campaign</CardTitle>
          <CardDescription>
            Track ROI for a new marketing investment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="campaignName">Campaign Name</Label>
              <Input
                id="campaignName"
                placeholder="e.g., Facebook Ads Q4"
                value={newCampaign.name}
                onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaignCost">Cost ($)</Label>
              <Input
                id="campaignCost"
                type="number"
                placeholder="0"
                value={newCampaign.cost}
                onChange={(e) => setNewCampaign({...newCampaign, cost: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaignType">Type</Label>
              <select
                id="campaignType"
                className="w-full px-3 py-2 border rounded-md"
                value={newCampaign.type}
                onChange={(e) => setNewCampaign({...newCampaign, type: e.target.value})}
              >
                <option value="content">Content Marketing</option>
                <option value="social_media">Social Media</option>
                <option value="email">Email Campaign</option>
                <option value="print">Print Marketing</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddCampaign} className="w-full">
                Add Campaign
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ROIDashboard;