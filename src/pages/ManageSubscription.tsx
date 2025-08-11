import { Helmet } from "react-helmet-async";
import AppHeader from "@/components/layout/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

const ManageSubscription = () => {
  const [loading, setLoading] = useState(false);

  const openCustomerPortal = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke("customer-portal", { body: {} });
      if (data?.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
        return;
      }
      if (data?.error) {
        toast(String(data.error));
        return;
      }
      if (error) {
        toast(error.message || "Failed to open customer portal");
        return;
      }
      toast("Could not create portal session");
    } catch (e: any) {
      console.error(e);
      toast(e?.message || "Failed to open customer portal");
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
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Manage Subscription</CardTitle>
              <CardDescription>Open the secure billing portal to update your plan or payment method.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="secondary" onClick={openCustomerPortal} disabled={loading}>
                {loading ? "Opening Portal…" : "Open Subscription Portal"}
              </Button>
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
