import { Helmet } from "react-helmet-async";
import AppHeader from "@/components/layout/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Home, CreditCard, ImagePlus } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { WelcomeTour } from "@/components/onboarding/WelcomeTour";
import { QuickSetup } from "@/components/onboarding/QuickSetup";
import { AISuggestions } from "@/components/content/AISuggestions";
import { LoadingSpinner, LoadingCard, LoadingText } from "@/components/ui/loading-spinner";
import { useToast } from "@/components/ui/use-toast";

const Dashboard = () => {
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [userNeighborhoods, setUserNeighborhoods] = useState<any[]>([]);
  const [showWelcomeTour, setShowWelcomeTour] = useState(false);
  const [showQuickSetup, setShowQuickSetup] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    contentCount: 0,
    neighborhoodCount: 0,
    creditsRemaining: 45
  });
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // Fetch profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('name, neighborhood, county, state, neighborhood_slug, onboarding_completed')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error) {
          toast({
            title: "Error loading profile",
            description: error.message,
            variant: "destructive"
          });
          return;
        }

        if (!isMounted) return;
        
        setDisplayName(profile?.name ?? null);
        const isOnboardingCompleted = profile?.onboarding_completed ?? false;
        setOnboardingCompleted(isOnboardingCompleted);
        
        // Show quick setup for new users (higher priority than welcome tour)
        if (!isOnboardingCompleted || !profile?.neighborhood || !profile?.county || !profile?.state) {
          setShowQuickSetup(true);
        } else if (!isOnboardingCompleted) {
          setShowWelcomeTour(true);
        }
        
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
      } catch (error) {
        if (isMounted) {
          toast({
            title: "Error loading dashboard",
            description: "Please refresh the page to try again.",
            variant: "destructive"
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadDashboard();
    return () => { isMounted = false; };
  }, [toast]);

  const generateContentUrl = (neighborhood: any) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return `/content/${neighborhood.neighborhood_slug}-${today}`;
  };

  const handleCompleteTour = async () => {
    setShowWelcomeTour(false);
    setOnboardingCompleted(true);
    
    // Update profile to mark onboarding as completed
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .upsert({ 
          user_id: user.id, 
          onboarding_completed: true 
        });
    }
  };

  const handleCompleteSetup = async () => {
    setShowQuickSetup(false);
    setOnboardingCompleted(true);
    // Refresh page to reload dashboard data after setup
    window.location.reload();
  };

  return (
    <>
      <Helmet>
        <title>Dashboard — The Hyper-Local Pulse</title>
        <meta name="description" content="Your command center for hyper-local content packages and performance stats." />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : '/dashboard'} />
      </Helmet>
      <AppHeader />
      <main className="container px-3 md:px-4 py-4 md:py-8">
        <section className="mb-4 md:mb-6">
          {isLoading ? (
            <LoadingText className="w-64 h-8" />
          ) : (
            <h1 className="text-xl md:text-3xl font-bold tracking-tight truncate text-gradient animate-fade-in">
              Welcome back{displayName ? `, ${displayName}` : ""}!
            </h1>
          )}
        </section>

        <section className="grid gap-6 animate-slide-up">
          {isLoading ? (
            <>
              <LoadingCard className="h-32" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <LoadingCard />
                <LoadingCard />
                <LoadingCard />
              </div>
              <LoadingCard className="h-48" />
            </>
          ) : (
            <>
              {/* Profile Completion Check */}
              {(!userNeighborhoods.length || !profile?.neighborhood) && (
                <Card className="border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                      <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">!</span>
                      </div>
                      Complete Your Setup
                    </CardTitle>
                    <CardDescription className="text-yellow-700 dark:text-yellow-300">
                      Add your market area information to start generating hyper-local content
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="default" className="w-full">
                      <Link to="/profile">Complete Profile Setup</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
              
              {userNeighborhoods.length > 0 && (
                <Card className="shadow-elevated bg-gradient-to-r from-card to-card/95 border-primary/10">
                  <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle>
                        Latest Content: {userNeighborhoods[0].neighborhood}, {userNeighborhoods[0].state} - {format(new Date(), 'MMMM d, yyyy')}
                      </CardTitle>
                      <CardDescription className="mt-2">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                <Card>
                  <CardHeader className="flex-row items-center gap-3 px-4 md:px-6 py-4 md:py-6">
                    <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <CardDescription className="text-xs md:text-sm truncate font-medium">Content Generated This Month</CardDescription>
                      <CardTitle className="text-xl md:text-2xl font-bold">{stats.contentCount}</CardTitle>
                    </div>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="flex-row items-center gap-3 px-4 md:px-6 py-4 md:py-6">
                    <Home className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <CardDescription className="text-xs md:text-sm truncate font-medium">Neighborhoods Covered</CardDescription>
                      <CardTitle className="text-xl md:text-2xl font-bold">{stats.neighborhoodCount}</CardTitle>
                    </div>
                  </CardHeader>
                </Card>
                <Card className="sm:col-span-2 lg:col-span-1">
                  <CardHeader className="flex-row items-center gap-3 px-4 md:px-6 py-4 md:py-6">
                    <CreditCard className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <CardDescription className="text-xs md:text-sm truncate font-medium">AI Media Credits</CardDescription>
                      <CardTitle className="text-xl md:text-2xl font-bold">{stats.creditsRemaining}</CardTitle>
                    </div>
                  </CardHeader>
                </Card>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <div>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription className="mt-1">Access your most-used tools</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 px-4 md:px-6">
                  <Button asChild variant="outline" className="h-auto p-4 md:p-5 flex flex-row sm:flex-col items-center sm:items-start gap-3 sm:gap-2 hover:scale-[1.02] transition-transform">
                    <Link to="/image-studio">
                      <ImagePlus className="h-5 w-5 sm:mb-2 flex-shrink-0" />
                      <div className="text-left flex-1 min-w-0">
                        <div className="font-semibold truncate">Image Studio</div>
                        <div className="text-sm text-muted-foreground truncate">Upload & enhance lifestyle photos</div>
                      </div>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-auto p-4 md:p-5 flex flex-row sm:flex-col items-center sm:items-start gap-3 sm:gap-2 hover:scale-[1.02] transition-transform">
                    <Link to="/social-media">
                      <div className="text-xl sm:text-2xl sm:mb-2 flex-shrink-0">📱</div>
                      <div className="text-left flex-1 min-w-0">
                        <div className="font-semibold truncate">Social Media Manager</div>
                        <div className="text-sm text-muted-foreground truncate">Schedule posts & track performance</div>
                      </div>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-auto p-4 md:p-5 flex flex-row sm:flex-col items-center sm:items-start gap-3 sm:gap-2 hover:scale-[1.02] transition-transform">
                    <Link to="/editor">
                      <div className="text-left flex-1 min-w-0">
                        <div className="font-semibold truncate">Newsletter Editor</div>
                        <div className="text-sm text-muted-foreground truncate">Create branded newsletters</div>
                      </div>
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Your Neighborhoods</CardTitle>
                  <CardDescription className="mt-1">Your market areas and quick content generation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {userNeighborhoods.map((neighborhood, index) => (
                    <div key={neighborhood.neighborhood_slug} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold truncate">
                          {neighborhood.neighborhood}, {neighborhood.state}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {neighborhood.county}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button asChild variant="outline" size="sm" className="w-full sm:w-auto hover:scale-105 transition-transform">
                          <Link to={`/content/${neighborhood.neighborhood_slug}-${neighborhood.report_date}`}>
                            <span className="truncate">View Latest</span>
                          </Link>
                        </Button>
                        <Button asChild variant="secondary" size="sm" className="w-full sm:w-auto hover:scale-105 transition-transform">
                          <Link to={generateContentUrl(neighborhood)}>
                            <span className="truncate">Generate Fresh</span>
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button asChild variant="outline" className="w-full hover:scale-[1.02] transition-transform">
                    <Link to="/profile">+ Add New Neighborhood</Link>
                  </Button>
                </CardContent>
              </Card>
              
              {onboardingCompleted && (
                <AISuggestions 
                  neighborhood={userNeighborhoods[0]?.neighborhood}
                  recentContentTypes={[]}
                />
              )}
            </>
          )}
        </section>
      </main>
      
      <QuickSetup 
        open={showQuickSetup}
        onComplete={handleCompleteSetup}
      />
      
      <WelcomeTour 
        open={showWelcomeTour} 
        onComplete={handleCompleteTour} 
      />
    </>
  );
};

export default Dashboard;
