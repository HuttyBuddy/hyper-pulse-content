import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Timer, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ReactNode;
}

function MetricCard({ title, value, description, trend = "neutral", icon }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          {trend === "up" && <TrendingUp className="w-3 h-3 text-green-500" />}
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

export function OnboardingMetrics() {
  const [metrics, setMetrics] = useState({
    totalSignups: 0,
    completedOnboarding: 0,
    avgTimeToValue: 0,
    contentGenerations: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Get total user profiles (signups)
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Get completed onboarding
        const { count: completedOnboarding } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('onboarding_completed', true);

        // Get content generations
        const { count: contentCount } = await supabase
          .from('content_history')
          .select('*', { count: 'exact', head: true });

        // Calculate average time to first value
        const { data: onboardingEvents } = await supabase
          .from('content_analytics')
          .select('event_data, created_at')
          .eq('content_type', 'onboarding')
          .eq('event_type', 'completed');

        let avgTimeToValue = 0;
        if (onboardingEvents && onboardingEvents.length > 0) {
          const totalTime = onboardingEvents.reduce((sum, event) => {
            const timeData = event.event_data as any;
            return sum + (timeData?.time_to_complete || 0);
          }, 0);
          avgTimeToValue = Math.round(totalTime / onboardingEvents.length / (1000 * 60)); // minutes
        }

        setMetrics({
          totalSignups: totalUsers || 0,
          completedOnboarding: completedOnboarding || 0,
          avgTimeToValue,
          contentGenerations: contentCount || 0
        });
      } catch (error) {
        console.error('Error fetching onboarding metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const completionRate = metrics.totalSignups > 0 
    ? Math.round((metrics.completedOnboarding / metrics.totalSignups) * 100)
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">Onboarding Performance</h3>
        <Badge variant={completionRate >= 60 ? "default" : "secondary"}>
          {completionRate}% completion rate
        </Badge>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Signups"
          value={metrics.totalSignups.toString()}
          description="Users who created accounts"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        
        <MetricCard
          title="Completed Setup"
          value={`${metrics.completedOnboarding}/${metrics.totalSignups}`}
          description={`${completionRate}% completion rate`}
          trend={completionRate >= 60 ? "up" : "neutral"}
          icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
        />
        
        <MetricCard
          title="Avg Time to Value"
          value={metrics.avgTimeToValue > 0 ? `${metrics.avgTimeToValue}min` : "N/A"}
          description="From signup to first content"
          trend={metrics.avgTimeToValue <= 10 ? "up" : "neutral"}
          icon={<Timer className="h-4 w-4 text-muted-foreground" />}
        />
        
        <MetricCard
          title="Content Generated"
          value={metrics.contentGenerations.toString()}
          description="Total content packages created"
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
      </div>
    </div>
  );
}