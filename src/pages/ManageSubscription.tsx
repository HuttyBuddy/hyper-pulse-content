import { Helmet } from "react-helmet-async";
import AppHeader from "@/components/layout/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/components/ui/sonner";
import { useState } from "react";
import { openCustomerPortal, refreshSubscriptionStatus } from "@/lib/billing";

const ManageSubscription = () => {
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<{ subscribed: boolean; subscription_tier?: string | null; subscription_end?: string | null } | null>(null);

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
      const res = await refreshSubscriptionStatus();
      if (res.ok) {
        setSubscription(res.data || null);
        setLastError(null);
      } else {
        setLastError(res.error || "Failed to refresh subscription status");
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <Helmet>
        <title>Manage Subscription — Hyper-Local Pulse</title>
        <meta name="description" content="Manage your subscription, billing, and payments securely via the customer portal." />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : '/manage-subscription'} />
      </Helmet>
      <AppHeader />
      <main className="container py-8 grid gap-6">
        <h1 className="sr-only">Manage Subscription</h1>
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Manage Subscription</CardTitle>
              <CardDescription>Open the secure billing portal to update your plan or payment method.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" onClick={openPortal} disabled={loading}>
                  {loading ? "Opening Portal…" : "Open Subscription Portal"}
                </Button>
                <Button variant="outline" onClick={refreshStatus} disabled={loading}>
                  {loading ? "Checking…" : "Refresh Subscription Status"}
                </Button>
              </div>

              {lastError && (
                <Alert variant="destructive">
                  <AlertTitle>Could not open portal</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <div className="text-sm break-words">{lastError}</div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(lastError);
                          toast("Error copied");
                        }}
                      >
                        Copy error
                      </Button>
                      <a
                        className="underline text-sm"
                        href="https://supabase.com/dashboard/project/fcayyxezuevsredxzmdj/functions/customer-portal/logs"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View logs
                      </a>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {subscription && (
                <div className="text-sm text-muted-foreground">
                  <div>
                    Status: {subscription.subscribed ? "Active" : "Inactive"}
                  </div>
                  {subscription.subscription_tier && (
                    <div>Plan: {subscription.subscription_tier}</div>
                  )}
                  {subscription.subscription_end && (
                    <div>Renews/ends: {new Date(subscription.subscription_end).toLocaleString()}</div>
                  )}
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                You’ll be redirected to our Stripe-powered customer portal in a new tab.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
};

export default ManageSubscription;
