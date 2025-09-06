import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Target, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FunnelStage {
  name: string;
  count: number;
  percentage: number;
  color: string;
  icon: React.ReactNode;
}

interface ConversionMetrics {
  signupToProfile: number;
  profileToFirstContent: number;
  overallConversion: number;
}

export function ConversionFunnel() {
  const [stages, setStages] = useState<FunnelStage[]>([]);
  const [metrics, setMetrics] = useState<ConversionMetrics>({
    signupToProfile: 0,
    profileToFirstContent: 0,
    overallConversion: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFunnelData = async () => {
      try {
        // Total signups (profiles created)
        const { count: totalSignups } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Completed onboarding (profile completed)
        const { count: completedProfiles } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('onboarding_completed', true);

        // Generated first content
        const { data: firstContentUsers } = await supabase
          .from('content_history')
          .select('user_id')
          .order('created_at', { ascending: true });

        const uniqueContentUsers = new Set(firstContentUsers?.map(u => u.user_id) || []).size;

        // Active users (multiple content generations)
        const { data: activeUsersData } = await supabase
          .from('content_history')
          .select('user_id')
          .order('created_at', { ascending: false })
          .limit(1000);

        // Count users with multiple content generations
        const userContentCounts = new Map();
        activeUsersData?.forEach(row => {
          const count = userContentCounts.get(row.user_id) || 0;
          userContentCounts.set(row.user_id, count + 1);
        });
        
        const activeCount = Array.from(userContentCounts.values()).filter(count => count > 1).length;

        const total = totalSignups || 1; // Avoid division by zero
        
        const funnelStages: FunnelStage[] = [
          {
            name: "Signed Up",
            count: total,
            percentage: 100,
            color: "bg-blue-500",
            icon: <Users className="w-4 h-4" />
          },
          {
            name: "Completed Setup",
            count: completedProfiles || 0,
            percentage: Math.round(((completedProfiles || 0) / total) * 100),
            color: "bg-green-500",
            icon: <CheckCircle className="w-4 h-4" />
          },
          {
            name: "Generated Content",
            count: uniqueContentUsers,
            percentage: Math.round((uniqueContentUsers / total) * 100),
            color: "bg-purple-500",
            icon: <Target className="w-4 h-4" />
          },
          {
            name: "Active Users",
            count: activeCount,
            percentage: Math.round((activeCount / total) * 100),
            color: "bg-orange-500",
            icon: <TrendingUp className="w-4 h-4" />
          }
        ];

        setStages(funnelStages);
        setMetrics({
          signupToProfile: Math.round(((completedProfiles || 0) / total) * 100),
          profileToFirstContent: completedProfiles > 0 ? Math.round((uniqueContentUsers / (completedProfiles || 1)) * 100) : 0,
          overallConversion: Math.round((uniqueContentUsers / total) * 100)
        });
      } catch (error) {
        console.error('Error fetching funnel data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFunnelData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          User Conversion Funnel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Funnel Visualization */}
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <div key={stage.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {stage.icon}
                  <span className="font-medium text-sm">{stage.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{stage.count}</Badge>
                  <Badge variant="outline">{stage.percentage}%</Badge>
                </div>
              </div>
              <Progress value={stage.percentage} className="h-3" />
              {index < stages.length - 1 && (
                <div className="flex justify-center">
                  <div className="text-xs text-muted-foreground">
                    ↓ {Math.round(((stages[index + 1].count / stage.count) * 100))}% conversion
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Key Metrics */}
        <div className="pt-4 border-t space-y-3">
          <h4 className="font-medium text-sm">Key Conversion Rates</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-primary">{metrics.signupToProfile}%</div>
              <div className="text-xs text-muted-foreground">Signup → Setup</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-primary">{metrics.profileToFirstContent}%</div>
              <div className="text-xs text-muted-foreground">Setup → Content</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-primary">{metrics.overallConversion}%</div>
              <div className="text-xs text-muted-foreground">Overall Conversion</div>
            </div>
          </div>
        </div>

        {/* Improvement Suggestions */}
        <div className="pt-4 border-t">
          <h4 className="font-medium text-sm mb-2">💡 Optimization Opportunities</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            {metrics.signupToProfile < 70 && (
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span>Improve onboarding flow - {100 - metrics.signupToProfile}% drop-off after signup</span>
              </div>
            )}
            {metrics.profileToFirstContent < 80 && (
              <div className="flex items-start gap-2">
                <Target className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>Streamline first content creation - guide users faster to value</span>
              </div>
            )}
            {metrics.overallConversion > 50 && (
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Great overall conversion rate! Focus on user retention next.</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}