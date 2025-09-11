import AppHeader from "@/components/layout/AppHeader";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import { openCustomerPortal, createCheckout } from "@/lib/billing";
import { useSubscription } from "@/hooks/use-subscription";
import { Check, Crown, Zap, Star } from "lucide-react";

const ManageSubscription = () => {
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const { subscription, loading: subscriptionLoading, refreshSubscription } = useSubscription();

  const openPortal = async () => {
    try {
      setLoading(true);
      const res = await openCustomerPortal();
      if (!res.ok) {
        setLastError(res.error ?? "Could not create portal session");
      } else {
        setLastError(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = async () => {
    try {
      setLoading(true);
      await refreshSubscription();
      setLastError(null);
    } catch (error) {
      setLastError(error instanceof Error ? error.message : "Failed to refresh subscription status");
    } finally {
      setLoading(false);
    }
  };

  const subscribeNow = async () => {
    try {
      setLoading(true);
      const res = await createCheckout();
      if (!res.ok) {
        setLastError(res.error ?? "Could not create checkout session");
      } else {
        setLastError(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    if (checkout === "success" || checkout === "canceled") {
      refreshStatus();
      if (checkout === "success") {
        toast("Subscription updated successfully!");
      }
    }
  }, []);

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      features: [
        "3 neighborhoods",
        "10 AI generations/month",
        "Basic templates",
        "Email support"
      ],
      current: !subscription?.subscribed
    },
    {
      name: "Premium",
      price: "$9.99",
      period: "month",
      features: [
        "Unlimited neighborhoods",
        "Unlimited AI generations",
        "Premium templates",
        "Advanced analytics",
        "Priority support",
        "Social media automation"
      ],
      current: subscription?.subscription_tier === "Premium",
      popular: true
    },
    {
      name: "Enterprise",
      price: "$29.99",
      period: "month",
      features: [
        "Everything in Premium",
        "White-label branding",
        "Custom integrations",
        "Dedicated support",
        "Advanced automation",
        "Team collaboration"
      ],
      current: subscription?.subscription_tier === "Enterprise"
    }
  ];

  return (
    <AppLayout 
      title="Manage Subscription — Hyper Pulse Content"
      description="Choose the perfect plan for your content generation needs. Upgrade or manage your subscription anytime."
    >
      <AppHeader />
      <main className="container py-8 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Subscription Plans</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect plan for your real estate marketing needs. Upgrade or downgrade anytime.
          </p>
          
          {subscription?.subscribed && (
            <Badge variant="secondary" className="text-sm">
              Currently on {subscription.subscription_tier} plan
            </Badge>
          )}
        </div>

        {/* Pricing Cards */}
        <section className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card key={plan.name} className={`relative ${plan.current ? 'border-primary shadow-lg' : ''} ${plan.popular ? 'border-primary' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge variant="default" className="bg-primary text-primary-foreground">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              {plan.current && (
                <div className="absolute -top-3 right-4">
                  <Badge variant="secondary">
                    <Check className="h-3 w-3 mr-1" />
                    Current Plan
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="flex items-center justify-center gap-2">
                  {plan.name === "Premium" && <Crown className="h-5 w-5 text-primary" />}
                  {plan.name === "Enterprise" && <Zap className="h-5 w-5 text-primary" />}
                  {plan.name}
                </CardTitle>
                <div className="space-y-1">
                  <div className="text-3xl font-bold">{plan.price}</div>
                  <div className="text-sm text-muted-foreground">per {plan.period}</div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button 
                  className="w-full" 
                  variant={plan.current ? "outline" : plan.popular ? "default" : "secondary"}
                  onClick={plan.current ? openPortal : subscribeNow}
                  disabled={loading || subscriptionLoading}
                >
                  {loading || subscriptionLoading ? "Loading..." : 
                   plan.current ? "Manage Plan" : 
                   plan.name === "Free" ? "Current Plan" : "Upgrade Now"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Management Section */}
        <section className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Management</CardTitle>
              <CardDescription>
                Manage your billing, update payment methods, or view your subscription history.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={openPortal} disabled={loading}>
                  {loading ? "Opening Portal…" : "Billing Portal"}
                </Button>
                <Button variant="outline" onClick={refreshStatus} disabled={loading || subscriptionLoading}>
                  {loading || subscriptionLoading ? "Checking…" : "Refresh Status"}
                </Button>
              </div>

              {lastError && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <div className="text-sm break-words">{lastError}</div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(lastError);
                        toast("Error copied to clipboard");
                      }}
                    >
                      Copy Error
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {subscription && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant={subscription.subscribed ? "default" : "secondary"}>
                      {subscription.subscribed ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {subscription.subscription_tier && (
                    <div className="flex justify-between">
                      <span>Current Plan:</span>
                      <span className="font-medium">{subscription.subscription_tier}</span>
                    </div>
                  )}
                  {subscription.subscription_end && (
                    <div className="flex justify-between">
                      <span>Next Billing:</span>
                      <span>{new Date(subscription.subscription_end).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Test mode active: Use card 4242 4242 4242 4242 with any future date and CVC.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
    </AppLayout>
  );
};

export default ManageSubscription;