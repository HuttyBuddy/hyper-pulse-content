import { Helmet } from "react-helmet-async";
import { useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { cleanupAuthState } from "@/lib/auth";
import AppUrlHelper from "@/components/auth/AppUrlHelper";
import { loginSchema, type LoginFormData } from "@/schemas/auth";

// Development mode bypass - redirect to dashboard
const DEV_MODE = import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH !== 'false';

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    // In development mode, auto-redirect to dashboard
    if (DEV_MODE) {
      navigate("/dashboard", { replace: true });
      return;
    }

    // If already authenticated, go to dashboard
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate("/dashboard", { replace: true });
      }
    });

    // If redirected after email verification
    const params = new URLSearchParams(window.location.search);
    if (params.get("verified") === "1") {
      // Ensure no auto-login session remains; force clean state
      cleanupAuthState();
      supabase.auth.signOut({ scope: 'global' }).finally(() => {
        toast({ title: "Email verified", description: "You can now log in." });
        const url = new URL(window.location.href);
        url.searchParams.delete("verified");
        window.history.replaceState({}, "", url.toString());
      });
    }
}, [navigate, toast]);

  const formatAuthError = (message?: string) => {
    const msg = message?.toLowerCase() || "";
    if (msg.includes("requested path is invalid") || msg.includes("redirect")) {
      return {
        title: "Redirect URL not allowed",
        description:
          "Set Supabase Site URL to your app origin and add it to Additional Redirect URLs.",
      };
    }
    return {
      title: "Login failed",
      description: message || "Please check your credentials and try again.",
    };
  };

  const onSubmit = async (data: LoginFormData) => {
    const { email, password } = data;

    try {
      // Clean up potential limbo states before attempting login
      cleanupAuthState();
      try { await supabase.auth.signOut({ scope: 'global' }); } catch {}

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password,
      });
      if (error) throw error;
      if (data.user) {
        // Check if user has completed profile setup
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed, neighborhood, county, state')
          .eq('user_id', data.user.id)
          .maybeSingle();
        
        // If profile is incomplete, redirect to dashboard which will show QuickSetup
        if (!profile?.onboarding_completed || !profile?.neighborhood) {
          window.location.href = "/dashboard";
        } else {
          // Profile is complete, go to dashboard
          window.location.href = "/dashboard";
        }
      }
    } catch (err: any) {
      const { title, description } = formatAuthError(err?.message);
      toast({ title, description, variant: "destructive" });
    }
  };

  return (
    <>
      <Helmet>
        <title>Login — The Hyper-Local Pulse</title>
        <meta name="description" content="Login to access your hyper-local content packages for real estate marketing." />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : '/'} />
      </Helmet>
      <main className="min-h-screen grid place-items-center bg-background">
        <div className="w-full max-w-md px-4">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Hyper Pulse Content</h1>
            <p className="text-muted-foreground mt-1">AI-powered content for modern agents</p>
          </div>
          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle>Welcome back</CardTitle>
              <CardDescription>Enter your credentials to continue</CardDescription>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="text-left">
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="you@company.com" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="text-left">
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button type="submit" className="w-full" variant="hero">Login</Button>
                <p className="text-sm text-muted-foreground">
                  New here? <Link to="/signup" className="underline underline-offset-4">Sign Up</Link>
                </p>
                <AppUrlHelper />
              </CardFooter>
            </form>
            </Form>
          </Card>
        </div>
      </main>
    </>
  );
};

export default Index;
