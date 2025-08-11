import { Helmet } from "react-helmet-async";
import { useNavigate, Link } from "react-router-dom";
import { useState, FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Demo: navigate to dashboard
    navigate("/dashboard");
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
                  New here? <Link to="/dashboard" className="underline underline-offset-4">Sign Up</Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
    </>
  );
};

export default Index;
