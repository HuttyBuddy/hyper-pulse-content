import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Mail, Phone, User, FileText, Download, Calculator } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LeadCaptureFormProps {
  type: 'newsletter' | 'valuation' | 'consultation' | 'download';
  contentId?: string;
  title?: string;
  className?: string;
}

const formConfigs = {
  newsletter: {
    title: "Get Market Updates",
    description: "Stay informed with weekly market insights",
    icon: <Mail className="h-6 w-6" />,
    submitText: "Subscribe to Newsletter",
    source: 'newsletter_signup'
  },
  valuation: {
    title: "Free Home Valuation", 
    description: "Get your property's current market value",
    icon: <Calculator className="h-6 w-6" />,
    submitText: "Get My Home Value",
    source: 'property_valuation'
  },
  consultation: {
    title: "Schedule Consultation",
    description: "Book a free 30-minute strategy session",
    icon: <Phone className="h-6 w-6" />,
    submitText: "Book Consultation",
    source: 'consultation_request'
  },
  download: {
    title: "Download Resource",
    description: "Get instant access to this content",
    icon: <Download className="h-6 w-6" />,
    submitText: "Download Now",
    source: 'download'
  }
};

const LeadCaptureForm = ({ type, contentId, title, className = "" }: LeadCaptureFormProps) => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const config = formConfigs[type];

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    propertyAddress: '',
    interests: [] as string[],
    message: '',
    source: window.location.href
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.email) {
      toast({
        title: "Missing Information",
        description: "First name and email are required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to submit this form",
          variant: "destructive"
        });
        return;
      }

      // Create lead in tracking table
      const { error: leadError } = await supabase
        .from('lead_generation_tracking')
        .insert({
          user_id: user.id,
          lead_source: config.source,
          lead_medium: contentId ? 'blog_post' : 'direct',
          content_id: contentId,
          lead_data: {
            name: `${formData.firstName} ${formData.lastName}`.trim(),
            email: formData.email,
            phone: formData.phone,
            propertyAddress: formData.propertyAddress,
            interests: formData.interests,
            message: formData.message,
            source_url: formData.source
          },
          lead_value: type === 'valuation' ? 5000 : type === 'consultation' ? 3000 : 1000,
          status: 'new'
        });

      if (leadError) throw leadError;

      // Add to newsletter subscribers if applicable
      if (type === 'newsletter' || formData.interests.length > 0) {
        const { error: subscriberError } = await supabase
          .from('newsletter_subscribers')
          .upsert({
            user_id: user.id,
            email: formData.email,
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            property_interests: formData.interests,
            subscription_source: config.source,
            is_active: true
          }, {
            onConflict: 'user_id,email'
          });

        if (subscriberError) console.warn('Subscriber upsert error:', subscriberError);
      }

      // Send notification email via edge function
      try {
        await supabase.functions.invoke('send-lead-notification', {
          body: {
            leadData: {
              name: `${formData.firstName} ${formData.lastName}`.trim(),
              email: formData.email,
              phone: formData.phone,
              type: config.title,
              source: config.source,
              message: formData.message
            }
          }
        });
      } catch (emailError) {
        console.warn('Email notification error:', emailError);
      }

      setSubmitted(true);
      toast({
        title: "Success!",
        description: `Thank you! We'll be in touch soon.`
      });

    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Submission Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Download className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Thank You!</h3>
          <p className="text-muted-foreground">
            {type === 'newsletter' && "You've been subscribed to our newsletter."}
            {type === 'valuation' && "We'll send your home valuation within 24 hours."}
            {type === 'consultation' && "We'll contact you to schedule your consultation."}
            {type === 'download' && "Your download should start automatically."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
          {config.icon}
        </div>
        <CardTitle className="text-xl">{title || config.title}</CardTitle>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                placeholder="John"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="john@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="(555) 123-4567"
            />
          </div>

          {(type === 'valuation' || type === 'consultation') && (
            <div className="space-y-2">
              <Label htmlFor="address">Property Address</Label>
              <Input
                id="address"
                value={formData.propertyAddress}
                onChange={(e) => setFormData({...formData, propertyAddress: e.target.value})}
                placeholder="123 Main St, City, State"
              />
            </div>
          )}

          {type === 'newsletter' && (
            <div className="space-y-2">
              <Label>Areas of Interest</Label>
              <Select onValueChange={(value) => {
                const interests = formData.interests.includes(value) 
                  ? formData.interests.filter(i => i !== value)
                  : [...formData.interests, value];
                setFormData({...formData, interests});
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your interests" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buying">Buying Property</SelectItem>
                  <SelectItem value="selling">Selling Property</SelectItem>
                  <SelectItem value="investing">Real Estate Investing</SelectItem>
                  <SelectItem value="market_trends">Market Trends</SelectItem>
                </SelectContent>
              </Select>
              {formData.interests.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {formData.interests.map((interest, index) => (
                    <span key={index} className="text-xs bg-primary/10 px-2 py-1 rounded">
                      {interest}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {(type === 'consultation' || type === 'download') && (
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                placeholder={
                  type === 'consultation' 
                    ? "Tell us about your real estate goals..."
                    : "Any specific questions about this resource?"
                }
                rows={3}
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Submitting..." : config.submitText}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default LeadCaptureForm;