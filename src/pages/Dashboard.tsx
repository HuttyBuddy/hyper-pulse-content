import { Helmet } from "react-helmet-async";
import AppHeader from "@/components/layout/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Home, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [userNeighborhoods, setUserNeighborhoods] = useState<any[]>([]);
  const [stats, setStats] = useState({
    contentCount: 0,
    neighborhoodCount: 0,
    creditsRemaining: 45
  });

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Fetch profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('name, neighborhood, county, state, neighborhood_slug')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (!error && isMounted) {
        setDisplayName(profile?.name ?? null);
        
        // Get user's neighborhoods from market reports
        const { data: reports } = await supabase
          .from('market_reports')
          .select('neighborhood, county, state, neighborhood_slug, report_date')
          .eq('user_id', user.id)
          .not('neighborhood', 'is', null)
          .order('created_at', { ascending: false });

        if (reports) {
          // Group by neighborhood and get latest for each
          const neighborhoodMap = new Map();
          reports.forEach(report => {
            const key = report.neighborhood_slug;
            if (!neighborhoodMap.has(key) || 
                new Date(report.report_date) > new Date(neighborhoodMap.get(key).report_date)) {
              neighborhoodMap.set(key, report);
            }
          });
          
          const neighborhoods = Array.from(neighborhoodMap.values());
          setUserNeighborhoods(neighborhoods);
          
          setStats({
            contentCount: reports.length,
            neighborhoodCount: neighborhoods.length,
            creditsRemaining: 45 // This would come from billing/subscription data
          });
        }
        
        // Add default neighborhood if none exist
        if (profile && (!reports || reports.length === 0)) {
          setUserNeighborhoods([{
            neighborhood: profile.neighborhood || 'Carmichael',
            county: profile.county || 'Sacramento County', 
            state: profile.state || 'CA',
            neighborhood_slug: profile.neighborhood_slug || 'carmichael',
            report_date: format(new Date(), 'yyyy-MM-dd')
          }]);
          setStats(prev => ({ ...prev, neighborhoodCount: 1 }));
        }
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const generateContentUrl = (neighborhood: any) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return `/content/${neighborhood.neighborhood_slug}-${today}`;
  };

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
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Welcome back{displayName ? `, ${displayName}` : ""}!</h1>
        </section>

        <section className="grid gap-6">
          {userNeighborhoods.length > 0 && (
            <Card className="shadow-elevated">
              <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>
                    Latest Content: {userNeighborhoods[0].neighborhood}, {userNeighborhoods[0].state} - {format(new Date(), 'MMMM d, yyyy')}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Generate fresh content for your primary market area
                  </CardDescription>
                </div>
                <div className="mt-4 md:mt-0 flex gap-2">
                  <Button asChild variant="outline">
                    <Link to={`/content/${userNeighborhoods[0].neighborhood_slug}-${userNeighborhoods[0].report_date}`}>
                      View Package
                    </Link>
                  </Button>
                  <Button asChild variant="hero">
                    <Link to={generateContentUrl(userNeighborhoods[0])}>
                      Generate Fresh
                    </Link>
                  </Button>
                </div>
              </CardHeader>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex-row items-center gap-3">
                <BarChart3 className="h-5 w-5 text-primary" />
                <div>
                  <CardDescription>Content Generated This Month</CardDescription>
                  <CardTitle className="text-xl">{stats.contentCount}</CardTitle>
                </div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="flex-row items-center gap-3">
                <Home className="h-5 w-5 text-primary" />
                <div>
                  <CardDescription>Neighborhoods Covered</CardDescription>
                  <CardTitle className="text-xl">{stats.neighborhoodCount}</CardTitle>
                </div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="flex-row items-center gap-3">
                <CreditCard className="h-5 w-5 text-primary" />
                <div>
                  <CardDescription>AI Media Credits</CardDescription>
                  <CardTitle className="text-xl">{stats.creditsRemaining}</CardTitle>
                </div>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Your Neighborhoods</CardTitle>
              <CardDescription>Your market areas and quick content generation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {userNeighborhoods.map((neighborhood, index) => (
                <div key={neighborhood.neighborhood_slug} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">
                      {neighborhood.neighborhood}, {neighborhood.state}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {neighborhood.county}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/content/${neighborhood.neighborhood_slug}-${neighborhood.report_date}`}>
                        View Latest
                      </Link>
                    </Button>
                    <Button asChild variant="secondary" size="sm">
                      <Link to={generateContentUrl(neighborhood)}>
                        Generate Fresh
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
              <Button asChild variant="outline" className="w-full">
                <Link to="/profile">+ Add New Neighborhood</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
};

export default Dashboard;
