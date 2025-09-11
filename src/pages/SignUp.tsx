import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
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
import { signUpSchema, type SignUpFormData } from "@/schemas/auth";

const SignUp = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirm: "",
    },
  });

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
      title: "Sign up failed",
      description: message || "Please try again.",
    };
  };

  const onSubmit = async (data: SignUpFormData) => {
    const { email, password } = data;

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
        title: "Check your email",
        description: "We've sent a verification link. Click it to activate your account, then return here to log in.",
      });
    } catch (err: any) {
      const { title, description } = formatAuthError(err?.message);
      toast({ title, description, variant: "destructive" });
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                  <p className="text-sm text-primary font-medium">🚀 Get Started in 60 Seconds</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Create account → Set market area → Generate first content package
                  </p>
                </div>
                
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
                <FormField
                  control={form.control}
                  name="confirm"
                  render={({ field }) => (
                    <FormItem className="text-left">
                      <FormLabel>Confirm Password</FormLabel>
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
                <Button type="submit" className="w-full" variant="hero">Create Account</Button>
                <p className="text-sm text-muted-foreground">
                  Already have an account? <Link to="/" className="underline underline-offset-4">Login</Link>
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

export default SignUp;
