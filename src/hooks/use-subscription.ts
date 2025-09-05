import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { refreshSubscriptionStatus } from "@/lib/billing";
import type { SubscriptionInfo } from "@/lib/billing";

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await refreshSubscriptionStatus();
      
      if (result.ok && result.data) {
        setSubscription(result.data);
      } else {
        setError(result.error || "Failed to fetch subscription status");
        setSubscription({ subscribed: false });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setSubscription({ subscribed: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Listen for auth changes and refresh subscription
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await refreshSubscription();
        } else if (event === 'SIGNED_OUT') {
          setSubscription(null);
          setLoading(false);
        }
      }
    );

    // Check initial subscription status
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        refreshSubscription();
      } else {
        setLoading(false);
      }
    });

    return () => authSubscription.unsubscribe();
  }, []);

  return {
    subscription,
    loading,
    error,
    refreshSubscription,
    isSubscribed: subscription?.subscribed || false,
    subscriptionTier: subscription?.subscription_tier,
    subscriptionEnd: subscription?.subscription_end
  };
}