import { Helmet } from "react-helmet-async";
import AppHeader from "@/components/layout/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Home, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  return (
    <>
      <Helmet>
        <title>Dashboard — The Hyper-Local Pulse</title>
        <meta name="description" content="Your command center for hyper-local content packages and performance stats." />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : '/dashboard'} />
      </Helmet>
      <AppHeader />
      <main className="container py-8">
        <section className="mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Welcome back, Alex Morgan!</h1>
        </section>

        <section className="grid gap-6">
          <Card className="shadow-elevated">
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Your Latest Pulse: Carmichael, CA - August 10, 2025</CardTitle>
                <CardDescription className="mt-1">Includes: 1 Blog Post, 5 Social Posts, 3 AI Images, 1 AI Video Clip.</CardDescription>
              </div>
              <div className="mt-4 md:mt-0">
                <Button asChild variant="hero">
                  <Link to="/content/carmichael-2025-08-10">View Content Package</Link>
                </Button>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex-row items-center gap-3">
                <BarChart3 className="h-5 w-5 text-primary" />
                <div>
                  <CardDescription>Content Generated This Month</CardDescription>
                  <CardTitle className="text-xl">12</CardTitle>
                </div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="flex-row items-center gap-3">
                <Home className="h-5 w-5 text-primary" />
                <div>
                  <CardDescription>Neighborhoods Covered</CardDescription>
                  <CardTitle className="text-xl">1</CardTitle>
                </div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="flex-row items-center gap-3">
                <CreditCard className="h-5 w-5 text-primary" />
                <div>
                  <CardDescription>AI Media Credits</CardDescription>
                  <CardTitle className="text-xl">45</CardTitle>
                </div>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Neighborhoods</CardTitle>
              <CardDescription>Your subscribed farm areas</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-base">Carmichael, CA</div>
              <Button variant="secondary">+ Add Neighborhood</Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
};

export default Dashboard;
