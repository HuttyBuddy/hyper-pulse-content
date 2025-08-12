import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

export type SubscriptionInfo = {
  subscribed: boolean;
  subscription_tier?: string | null;
  subscription_end?: string | null;
};

export const openCustomerPortal = async (): Promise<{ ok: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke("customer-portal", { body: {} });
    if (data?.url) {
      window.open(data.url, "_blank", "noopener,noreferrer");
      return { ok: true };
    }
    if (data?.error) {
      toast(String(data.error));
      return { ok: false, error: String(data.error) };
    }
    if (error) {
      toast(error.message || "Failed to open customer portal");
      return { ok: false, error: error.message || "Failed to open customer portal" };
    }
    const msg = "Could not create portal session";
    toast(msg);
    return { ok: false, error: msg };
  } catch (e: any) {
    const msg = e?.message || "Failed to open customer portal";
    toast(msg);
    return { ok: false, error: msg };
  }
};

export const refreshSubscriptionStatus = async (): Promise<{ ok: boolean; data?: SubscriptionInfo; error?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke("check-subscription", { body: {} });
    if (error) {
      toast(error.message || "Failed to check subscription");
      return { ok: false, error: error.message || "Failed to check subscription" };
    }
    if (data?.error) {
      toast(String(data.error));
      return { ok: false, error: String(data.error) };
    }
    return { ok: true, data };
  } catch (e: any) {
    const msg = e?.message || "Failed to check subscription";
    toast(msg);
    return { ok: false, error: msg };
  }
};

export const createCheckout = async (): Promise<{ ok: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke("create-checkout", { body: {} });
    if (data?.url) {
      window.open(data.url, "_blank", "noopener,noreferrer");
      return { ok: true };
    }
    if (data?.error) {
      toast(String(data.error));
      return { ok: false, error: String(data.error) };
    }
    if (error) {
      toast(error.message || "Failed to start checkout");
      return { ok: false, error: error.message || "Failed to start checkout" };
    }
    const msg = "Could not create checkout session";
    toast(msg);
    return { ok: false, error: msg };
  } catch (e: any) {
    const msg = e?.message || "Failed to start checkout";
    toast(msg);
    return { ok: false, error: msg };
  }
};
