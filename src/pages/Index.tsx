import { Helmet } from "react-helmet-async";
import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect, FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cleanupAuthState } from "@/lib/auth";
import AppUrlHelper from "@/components/auth/AppUrlHelper";

// Development mode bypass - redirect to dashboard
const DEV_MODE = import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH !== 'false';

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    if (!email.trim()) {
      toast({ 
        title: "Email required", 
        description: "Please enter your email address.",
        variant: "destructive" 
      });
      return;
    }
    
    if (!password.trim()) {
      toast({ 
        title: "Password required", 
        description: "Please enter your password.",
        variant: "destructive" 
      });
      return;
    }
    
    if (password.length < 6) {
      toast({ 
        title: "Password too short", 
        description: "Password must be at least 6 characters.",
        variant: "destructive" 
      });
      return;
    }

    try {
      // Clean up potential limbo states before attempting login
      cleanupAuthState();
      try { await supabase.auth.signOut({ scope: 'global' }); } catch {}

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      if (data.user) {
        // Full refresh ensures a clean state everywhere
        window.location.href = "/dashboard";
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
            <h1 className="text-3xl font-bold tracking-tight">The Hyper‑Local Pulse</h1>
            <p className="text-muted-foreground mt-1">AI-powered content for modern agents</p>
          </div>
          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle>Welcome back</CardTitle>
              <CardDescription>Enter your credentials to continue</CardDescription>
            </CardHeader>
            <form onSubmit={onSubmit}>
              <CardContent className="space-y-4">
                <div className="text-left">
                  <label htmlFor="email" className="text-sm">Email</label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
                </div>
                <div className="text-left">
                  <label htmlFor="password" className="text-sm">Password</label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button type="submit" className="w-full" variant="hero">Login</Button>
                <p className="text-sm text-muted-foreground">
                  New here? <Link to="/signup" className="underline underline-offset-4">Sign Up</Link>
                </p>
                <AppUrlHelper />
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
    </>
  );
};

export default Index;
