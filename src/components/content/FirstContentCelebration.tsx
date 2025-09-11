import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Share2, Download, Copy, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface FirstContentCelebrationProps {
  neighborhood: string;
  onDismiss: () => void;
}

export function FirstContentCelebration({ neighborhood, onDismiss }: FirstContentCelebrationProps) {
  const [isFirstContent, setIsFirstContent] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkIfFirstContent = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check if this is the user's first content
        const { data: contentHistory, count } = await supabase
          .from('content_history')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id);

        if (count && count <= 1) {
          setIsFirstContent(true);
          
          // Track first content generation milestone
          await supabase.from('content_analytics').insert({
            user_id: user.id,
            content_type: 'milestone',
            event_type: 'first_content_generated',
            event_data: { 
              neighborhood,
              timestamp: Date.now()
            }
          });
        }
      } catch (error) {
        console.error('Error checking content history:', error);
      } finally {
        setLoading(false);
      }
    };

    checkIfFirstContent();
  }, [neighborhood]);

  const handleShareSuccess = () => {
    toast({
      title: "Great start!",
      description: "Your first content package is ready to share and grow your business.",
    });
    
    // Track the share action
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('content_analytics').insert({
        user_id: user.id,
        content_type: 'milestone',
        event_type: 'first_content_shared',
        event_data: { 
          neighborhood,
          action: 'share_success',
          timestamp: Date.now()
        }
      });
    }
  };

  if (loading || !isFirstContent) return null;

  return (
    <Card className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border-primary/20 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
          </div>
          
          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-primary">🎉 Congratulations!</h3>
                <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">
                  First Content
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                You've just generated your first hyper-local content package for {neighborhood}! 
                You now have professional market analysis, social media posts, and newsletter content 
                ready to engage your audience.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // Copy blog content functionality would go here
                  navigator.clipboard.writeText(window.location.href);
                  toast({ title: "Link copied!", description: "Share your content package" });
                  handleShareSuccess();
                }}
                className="flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy Link
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // Share functionality
                  if (navigator.share) {
                    navigator.share({
                      title: `${neighborhood} Market Pulse`,
                      url: window.location.href
                    });
                  }
                  handleShareSuccess();
                }}
                className="flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              
              <Button 
                variant="secondary" 
                size="sm"
                onClick={onDismiss}
                className="flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Got it!
              </Button>
            </div>

            <div className="bg-background/50 p-3 rounded-lg">
              <h4 className="font-medium text-sm mb-2">🚀 What's next?</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Use the social media posts on your platforms</li>
                <li>• Send the newsletter to your subscriber list</li>
                <li>• Schedule regular content updates (weekly recommended)</li>
                <li>• Check out Analytics to track performance</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}