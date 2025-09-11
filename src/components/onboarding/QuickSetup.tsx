import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, MapPin, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

interface QuickSetupProps {
  open: boolean;
  onComplete: () => void;
}

export function QuickSetup({ open, onComplete }: QuickSetupProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [county, setCounty] = useState("");
  const [state, setState] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  if (!open) return null;

  const handleNext = async () => {
    if (step === 1) {
      if (!name.trim()) {
        toast({
          title: "Name required",
          description: "Please enter your name to continue",
          variant: "destructive"
        });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!neighborhood.trim() || !county.trim() || !state.trim()) {
        toast({
          title: "Location required",  
          description: "Please complete all location fields",
          variant: "destructive"
        });
        return;
      }
      await handleCreateFirstContent();
    }
  };

  const handleCreateFirstContent = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Save profile with onboarding completed
      const neighborhoodSlug = neighborhood.toLowerCase().replace(/\s+/g, '-');
      const { error: profileError } = await supabase.from('profiles').upsert({
        user_id: user.id,
        name: name.trim(),
        neighborhood: neighborhood.trim(),
        county: county.trim(),
        state: state.trim(),
        neighborhood_slug: neighborhoodSlug,
        onboarding_completed: true
      });
      
      if (profileError) {
        console.error('Profile save error:', profileError);
        throw new Error('Failed to save profile');
      }

      // Trigger market data fetch for this location
      try {
        await supabase.functions.invoke('fetch-market-data', {
          body: {
            neighborhood: neighborhood.trim(),
            county: county.trim(),
            state: state.trim(),
            neighborhood_slug: neighborhoodSlug
          }
        });
      } catch (marketError) {
        console.warn('Market data fetch failed, but continuing:', marketError);
      }

      // Navigate directly to first content generation
      const today = format(new Date(), 'yyyy-MM-dd');
      const contentSlug = `${neighborhoodSlug}-${today}`;
      
      toast({
        title: "Profile created!",
        description: "Generating your first hyper-local content package...",
      });

      // Track onboarding completion
      await supabase.from('content_analytics').insert({
        user_id: user.id,
        content_type: 'onboarding',
        event_type: 'completed',
        event_data: { 
          time_to_complete: Date.now(),
          neighborhood: neighborhood.trim()
        }
      });

      onComplete();
      navigate(`/content/${contentSlug}`);
    } catch (error) {
      console.error('Setup error:', error);
      toast({
        title: "Setup failed",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            {step === 1 ? (
              <Sparkles className="w-6 h-6 text-primary" />
            ) : (
              <MapPin className="w-6 h-6 text-primary" />
            )}
          </div>
          <CardTitle>
            {step === 1 ? "Welcome to Hyper-Local Pulse!" : "Set Your Market Area"}
          </CardTitle>
          <CardDescription>
            {step === 1 
              ? "Let's get you set up to create your first content package"
              : "Tell us about your primary market to generate targeted content"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Alex Morgan"
                  className="mt-1"
                />
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  What you'll get in your first package:
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Professional market analysis blog post with real data</li>
                  <li>• 5 ready-to-post social media updates</li>
                  <li>• Newsletter draft for your subscriber list</li>
                  <li>• Current market statistics and trends</li>
                  <li>• Lifestyle insights for your area</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="neighborhood">Neighborhood</Label>
                <Input
                  id="neighborhood"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="e.g., Carmichael"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="county">County</Label>
                <Input
                  id="county"
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  placeholder="e.g., Sacramento County"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g., CA"
                  className="mt-1"
                />
              </div>
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <p className="text-sm">
                  <strong>🎯 Ready to Launch:</strong> We'll fetch live market data for {neighborhood || 'your area'} and create your first professional content package.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  This usually takes 30-45 seconds. You'll have everything you need to start marketing immediately.
                </p>
                <ul className="text-xs mt-2 space-y-1 text-muted-foreground">
                  <li>• Market analysis blog post with current data</li>
                  <li>• Ready-to-use social media content</li>
                  <li>• Newsletter draft for your subscribers</li>
                  <li>• Professional branding integration</li>
                </ul>
                <p className="text-xs mt-2 font-medium text-primary">
                  This takes about 30 seconds to generate.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Back  
              </Button>
            )}
            <Button 
              onClick={handleNext} 
              disabled={loading}
              className={`ml-auto ${step === 2 ? 'min-w-[200px]' : ''}`}
              variant="hero"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Setting up...
                </div>
              ) : step === 1 ? "Continue" : "Generate My First Content"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}