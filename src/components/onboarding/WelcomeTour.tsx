import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, MapPin, BarChart3, Sparkles, Users } from "lucide-react";

interface WelcomeTourProps {
  open: boolean;
  onComplete: () => void;
}

const tourSteps = [
  {
    title: "Welcome to Hyper Pulse Content!",
    description: "Your AI-powered real estate content creation platform",
    icon: <Sparkles className="h-8 w-8 text-primary" />,
    content: "Empower your real estate business with cutting-edge AI-generated content packages that position you as the go-to community expert and drive meaningful engagement."
  },
  {
    title: "Set Your Market Area",
    description: "Define your primary neighborhoods and coverage areas",
    icon: <MapPin className="h-8 w-8 text-primary" />,
    content: "Start by adding your primary neighborhood, county, and state. This helps us generate accurate, location-specific content that resonates with your local market."
  },
  {
    title: "Generate Content Packages",
    description: "Create comprehensive content for your marketing",
    icon: <BarChart3 className="h-8 w-8 text-primary" />,
    content: "Each package includes market analysis blogs, social media posts, lifestyle insights, and AI-generated visuals—all tailored to your specific market area."
  },
  {
    title: "Build Your Brand",
    description: "Upload your branding assets for consistent messaging",
    icon: <Users className="h-8 w-8 text-primary" />,
    content: "Add your headshot, personal logo, and brokerage branding to ensure all generated content reflects your professional image and maintains brand consistency."
  }
];

export const WelcomeTour = ({ open, onComplete }: WelcomeTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = tourSteps[currentStep];

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {currentStep + 1} of {tourSteps.length}
            </Badge>
          </div>
        </DialogHeader>
        
        <Card className="border-0 shadow-none">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="flex justify-center">
              {currentStepData.icon}
            </div>
            
            <div>
              <DialogTitle className="text-xl mb-2">{currentStepData.title}</DialogTitle>
              <DialogDescription className="text-base text-muted-foreground mb-4">
                {currentStepData.description}
              </DialogDescription>
            </div>
            
            <p className="text-sm leading-relaxed">
              {currentStepData.content}
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-between pt-4">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <Button onClick={handleNext} className="flex items-center gap-2">
            {currentStep === tourSteps.length - 1 ? "Get Started" : "Next"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};