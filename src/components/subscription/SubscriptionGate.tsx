import { ReactNode } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Lock } from "lucide-react";
import { createCheckout } from "@/lib/billing";
import { toast } from "@/components/ui/sonner";

interface SubscriptionGateProps {
  children: ReactNode;
  requiredTier?: string;
  fallbackContent?: ReactNode;
  featureName?: string;
}

export default function SubscriptionGate({ 
  children, 
  requiredTier = "Premium", 
  fallbackContent,
  featureName = "feature"
}: SubscriptionGateProps) {
  const { subscription, loading, isSubscribed } = useSubscription();

  const handleUpgrade = async () => {
    try {
      const result = await createCheckout();
      if (!result.ok) {
        toast.error(result.error || "Failed to start checkout");
      }
    } catch (error) {
      toast.error("Failed to start upgrade process");
    }
  };

  if (loading) {
    return (
      <Card className="border-muted">
        <CardContent className="p-6">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-muted h-10 w-10"></div>
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if user has required subscription
  const hasRequiredAccess = isSubscribed && (
    !requiredTier || 
    subscription?.subscription_tier === requiredTier ||
    (requiredTier === "Basic" && ["Basic", "Premium", "Enterprise"].includes(subscription?.subscription_tier || "")) ||
    (requiredTier === "Premium" && ["Premium", "Enterprise"].includes(subscription?.subscription_tier || ""))
  );

  if (hasRequiredAccess) {
    return <>{children}</>;
  }

  if (fallbackContent) {
    return <>{fallbackContent}</>;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Crown className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          <Lock className="h-5 w-5" />
          Premium Feature
        </CardTitle>
        <CardDescription>
          Upgrade to {requiredTier} to access {featureName}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline">
            Current: {subscription?.subscription_tier || "Free"}
          </Badge>
          <Badge variant="secondary">
            Required: {requiredTier}
          </Badge>
        </div>
        
        <Button onClick={handleUpgrade} className="w-full">
          <Crown className="h-4 w-4 mr-2" />
          Upgrade to {requiredTier}
        </Button>
        
        <p className="text-xs text-muted-foreground">
          Unlock unlimited content generation, advanced analytics, and priority support
        </p>
      </CardContent>
    </Card>
  );
}