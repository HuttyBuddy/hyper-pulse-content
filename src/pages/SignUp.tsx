import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { useState, FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cleanupAuthState } from "@/lib/auth";

const SignUp = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: "Passwords do not match", description: "Please confirm your password.", variant: "destructive" });
      return;
    }

    try {
      cleanupAuthState();
      try { await supabase.auth.signOut({ scope: 'global' }); } catch {}

      const redirectUrl = `${window.location.origin}/?verified=1`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectUrl }
      });
      if (error) throw error;

      toast({
        title: "Verify your email",
        description: "We've sent a verification link. After verifying, return to the login page.",
      });
    } catch (err: any) {
      toast({ title: "Sign up failed", description: err?.message || "Please try again.", variant: "destructive" });
    }
  };

  return (
    <>
      <Helmet>
        <title>Sign Up — The Hyper-Local Pulse</title>
        <meta name="description" content="Create your Hyper-Local Pulse account to access AI-generated content packages." />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : '/signup'} />
      </Helmet>
      <main className="min-h-screen grid place-items-center bg-background">
        <div className="w-full max-w-md px-4">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Sign Up for The Hyper‑Local Pulse</h1>
            <p className="text-muted-foreground mt-1">Create your account to get your first Pulse</p>
          </div>
          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle>Create your account</CardTitle>
              <CardDescription>We’ll send a verification email after you sign up</CardDescription>
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
                <div className="text-left">
                  <label htmlFor="confirm" className="text-sm">Confirm Password</label>
                  <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" required />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button type="submit" className="w-full" variant="hero">Create Account</Button>
                <p className="text-sm text-muted-foreground">
                  Already have an account? <Link to="/" className="underline underline-offset-4">Login</Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
    </>
  );
};

export default SignUp;
