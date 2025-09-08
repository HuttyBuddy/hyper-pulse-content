import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Mail, Clock, HelpCircle } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

export default function Support() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "Support request submitted",
        description: "We'll get back to you within 24 hours.",
      });
      setFormData({ name: "", email: "", subject: "", message: "" });
      setIsSubmitting(false);
    }, 1000);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AppLayout
      title="Customer Support — Hyper-Local Pulse"
      description="Get help with Hyper-Local Pulse. Contact our support team, browse FAQs, and find answers to common questions."
      canonical="/support"
    >
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Customer Support</h1>
          <p className="text-xl text-muted-foreground">
            We're here to help you get the most out of Hyper-Local Pulse
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Our Team
              </CardTitle>
              <CardDescription>
                Send us a message and we'll respond within 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => handleInputChange("subject", e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    rows={4}
                    value={formData.message}
                    onChange={(e) => handleInputChange("message", e.target.value)}
                    required
                  />
                </div>
                
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Direct Contact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">Email us directly:</p>
                <a 
                  href="mailto:support@hyper-local-pulse.com" 
                  className="text-primary hover:underline font-medium"
                >
                  support@hyper-local-pulse.com
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Response Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  <li>• General inquiries: Within 24 hours</li>
                  <li>• Technical issues: Within 12 hours</li>
                  <li>• Billing questions: Within 6 hours</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Frequently Asked Questions
            </CardTitle>
            <CardDescription>
              Find quick answers to common questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              <AccordionItem value="getting-started">
                <AccordionTrigger>How do I get started with Hyper-Local Pulse?</AccordionTrigger>
                <AccordionContent>
                  After signing up, you'll be guided through our quick setup process. You can create your first marketing content using our AI-powered tools, set up lead capture forms, and start tracking your ROI right away.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="pricing">
                <AccordionTrigger>What are the pricing plans?</AccordionTrigger>
                <AccordionContent>
                  We offer flexible pricing plans to suit different needs. Visit your subscription management page to view current plans and upgrade or downgrade as needed.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="content-creation">
                <AccordionTrigger>How does the AI content creation work?</AccordionTrigger>
                <AccordionContent>
                  Our AI analyzes your local market data, property information, and target audience to create personalized marketing content. You can customize templates, generate social media posts, newsletters, and more.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="lead-management">
                <AccordionTrigger>Can I manage leads within the platform?</AccordionTrigger>
                <AccordionContent>
                  Yes! Our platform includes comprehensive lead management tools. You can track lead sources, monitor conversion rates, and analyze ROI across different marketing channels.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="integrations">
                <AccordionTrigger>What integrations are available?</AccordionTrigger>
                <AccordionContent>
                  We integrate with popular social media platforms, email marketing services, and CRM systems. Contact support if you need help setting up specific integrations.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="data-privacy">
                <AccordionTrigger>How is my data protected?</AccordionTrigger>
                <AccordionContent>
                  We take data privacy seriously. All data is encrypted, stored securely, and we comply with industry standards. Read our Privacy Policy for detailed information about how we handle your data.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}