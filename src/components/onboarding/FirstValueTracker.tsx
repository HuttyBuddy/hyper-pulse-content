import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FirstValueTrackerProps {
  userId: string;
}

interface OnboardingMetrics {
  signupTime?: string;
  profileCompletionTime?: string;
  firstContentTime?: string;
  timeToFirstValue?: number; // in minutes
}

export function FirstValueTracker({ userId }: FirstValueTrackerProps) {
  const [metrics, setMetrics] = useState<OnboardingMetrics>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Get user signup time from auth
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get onboarding completion event
        const { data: onboardingEvents } = await supabase
          .from('content_analytics')
          .select('*')
          .eq('user_id', userId)
          .eq('content_type', 'onboarding')
          .eq('event_type', 'completed')
          .order('created_at', { ascending: true })
          .limit(1);

        // Get first content generation event
        const { data: contentEvents } = await supabase
          .from('content_history')
          .select('created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: true })
          .limit(1);

        const signupTime = user.created_at;
        const profileTime = onboardingEvents?.[0]?.created_at;
        const firstContentTime = contentEvents?.[0]?.created_at;

        let timeToValue = 0;
        if (signupTime && firstContentTime) {
          const signup = new Date(signupTime).getTime();
          const firstContent = new Date(firstContentTime).getTime();
          timeToValue = Math.round((firstContent - signup) / (1000 * 60)); // minutes
        }

        setMetrics({
          signupTime,
          profileCompletionTime: profileTime,
          firstContentTime,
          timeToFirstValue: timeToValue
        });
      } catch (error) {
        console.error('Error fetching onboarding metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [userId]);

  if (loading) return null;

  const hasCompletedOnboarding = !!metrics.profileCompletionTime;
  const hasGeneratedContent = !!metrics.firstContentTime;
  const timeToValue = metrics.timeToFirstValue || 0;

  return (
    <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Your Success Journey
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm">Account Created</span>
          </div>
          <Badge variant="secondary">✓ Complete</Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasCompletedOnboarding ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <Clock className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="text-sm">Profile Setup</span>
          </div>
          <Badge variant={hasCompletedOnboarding ? "secondary" : "outline"}>
            {hasCompletedOnboarding ? "✓ Complete" : "Pending"}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasGeneratedContent ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <Clock className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="text-sm">First Content Generated</span>
          </div>
          <Badge variant={hasGeneratedContent ? "secondary" : "outline"}>
            {hasGeneratedContent ? "✓ Complete" : "Pending"}
          </Badge>
        </div>

        {timeToValue > 0 && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Time to First Value:</span>
              <Badge variant={timeToValue <= 10 ? "default" : "secondary"}>
                {timeToValue} minutes
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {timeToValue <= 5 ? "🚀 Lightning fast!" : 
               timeToValue <= 10 ? "⚡ Great speed!" :
               "💡 Room for improvement"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}