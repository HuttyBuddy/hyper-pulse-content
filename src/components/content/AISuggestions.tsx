import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Users, MapPin, Calendar } from "lucide-react";
import { toast } from "@/components/ui/sonner";

interface SuggestionItem {
  id: string;
  type: 'content' | 'timing' | 'topic' | 'enhancement';
  title: string;
  description: string;
  actionText: string;
  priority: 'high' | 'medium' | 'low';
  icon: JSX.Element;
}

interface AISuggestionsProps {
  neighborhood?: string;
  recentContentTypes?: string[];
  onApplySuggestion?: (suggestion: SuggestionItem) => void;
}

export const AISuggestions = ({ 
  neighborhood = "Your Area", 
  recentContentTypes = [],
  onApplySuggestion 
}: AISuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateSuggestions();
  }, [neighborhood, recentContentTypes]);

  const generateSuggestions = async () => {
    setLoading(true);
    
    // Simulate AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const generatedSuggestions: SuggestionItem[] = [
      {
        id: '1',
        type: 'content',
        title: 'Market Trend Analysis',
        description: `Create a deep-dive analysis of ${neighborhood}'s Q4 market trends with year-over-year comparisons`,
        actionText: 'Generate Analysis',
        priority: 'high',
        icon: <TrendingUp className="h-4 w-4" />
      },
      {
        id: '2',
        type: 'topic',
        title: 'Seasonal Content',
        description: 'Winter market insights and holiday home buying tips for your audience',
        actionText: 'Create Content',
        priority: 'medium',
        icon: <Calendar className="h-4 w-4" />
      },
      {
        id: '3',
        type: 'enhancement',
        title: 'Social Media Boost',
        description: 'Add more lifestyle imagery and local business spotlights to increase engagement',
        actionText: 'Enhance Posts',
        priority: 'medium',
        icon: <Users className="h-4 w-4" />
      },
      {
        id: '4',
        type: 'timing',
        title: 'Optimal Posting Schedule',
        description: 'Your audience is most active on Wednesdays at 7 PM and Saturdays at 10 AM',
        actionText: 'Schedule Content',
        priority: 'low',
        icon: <MapPin className="h-4 w-4" />
      }
    ];

    // Filter suggestions based on recent content types
    const filteredSuggestions = generatedSuggestions.filter(suggestion => {
      if (recentContentTypes.length === 0) return true;
      
      // Don't suggest content types that were just created
      if (suggestion.type === 'content' && recentContentTypes.includes('blog')) {
        return false;
      }
      
      return true;
    });

    setSuggestions(filteredSuggestions);
    setLoading(false);
  };

  const handleApplySuggestion = (suggestion: SuggestionItem) => {
    if (onApplySuggestion) {
      onApplySuggestion(suggestion);
    } else {
      toast.success(`Applied suggestion: ${suggestion.title}`);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'content': return <TrendingUp className="h-4 w-4" />;
      case 'timing': return <Calendar className="h-4 w-4" />;
      case 'topic': return <Sparkles className="h-4 w-4" />;
      case 'enhancement': return <Users className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Content Suggestions
        </CardTitle>
        <CardDescription>
          Personalized recommendations to improve your content strategy
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full mb-3"></div>
                <div className="h-8 bg-muted rounded w-24"></div>
              </div>
            ))}
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Great job! No immediate suggestions at this time.
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <div key={suggestion.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeIcon(suggestion.type)}
                      <h3 className="font-medium">{suggestion.title}</h3>
                      <Badge className={getPriorityColor(suggestion.priority)}>
                        {suggestion.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {suggestion.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    size="sm" 
                    onClick={() => handleApplySuggestion(suggestion)}
                    className="flex items-center gap-2"
                  >
                    {suggestion.icon}
                    {suggestion.actionText}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-6 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={generateSuggestions}
            className="w-full"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Refresh Suggestions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};