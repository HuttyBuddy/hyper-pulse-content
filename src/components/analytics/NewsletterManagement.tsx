import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { 
  Mail, 
  Send, 
  Users, 
  Plus,
  Calendar,
  Eye,
  MousePointer,
  UserMinus,
  Filter
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Subscriber {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  property_interests: string[];
  subscription_source: string;
  is_active: boolean;
  tags: string[];
  created_at: string;
}

interface EmailCampaign {
  id: string;
  campaign_name: string;
  subject_line: string;
  recipients_count: number;
  open_rate: number;
  click_rate: number;
  sent_at: string;
  status: string;
}

const NewsletterManagement = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubscriberDialogOpen, setIsSubscriberDialogOpen] = useState(false);
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newSubscriber, setNewSubscriber] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    interests: [] as string[],
    source: 'manual'
  });

  const [newCampaign, setNewCampaign] = useState({
    name: '',
    subject: '',
    content: '',
    recipientTags: [] as string[]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch subscribers
      const { data: subscribersData } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Fetch email campaigns
      const { data: campaignsData } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setSubscribers(subscribersData || []);
      setCampaigns(campaignsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch newsletter data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubscriber = async () => {
    if (!newSubscriber.email) {
      toast({
        title: "Missing Information",
        description: "Email is required",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({
          user_id: user.id,
          email: newSubscriber.email,
          first_name: newSubscriber.firstName,
          last_name: newSubscriber.lastName,
          phone: newSubscriber.phone,
          property_interests: newSubscriber.interests,
          subscription_source: newSubscriber.source,
          is_active: true,
          tags: []
        });

      if (error) throw error;

      toast({
        title: "Subscriber Added",
        description: "New subscriber has been added successfully"
      });

      setNewSubscriber({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        interests: [],
        source: 'manual'
      });
      setIsSubscriberDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error adding subscriber:', error);
      toast({
        title: "Error",
        description: "Failed to add subscriber",
        variant: "destructive"
      });
    }
  };

  const handleCreateCampaign = async () => {
    if (!newCampaign.name || !newCampaign.subject || !newCampaign.content) {
      toast({
        title: "Missing Information",
        description: "Campaign name, subject, and content are required",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const activeSubscribers = subscribers.filter(sub => sub.is_active);
      
      const { error } = await supabase
        .from('email_campaigns')
        .insert({
          user_id: user.id,
          campaign_name: newCampaign.name,
          subject_line: newCampaign.subject,
          recipients_count: activeSubscribers.length,
          status: 'draft'
        });

      if (error) throw error;

      toast({
        title: "Campaign Created",
        description: "Email campaign has been created as draft"
      });

      setNewCampaign({
        name: '',
        subject: '',
        content: '',
        recipientTags: []
      });
      setIsCampaignDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive"
      });
    }
  };

  const handleUnsubscribe = async (subscriberId: string) => {
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .update({ is_active: false })
        .eq('id', subscriberId);

      if (error) throw error;

      toast({
        title: "Unsubscribed",
        description: "Subscriber has been deactivated"
      });

      fetchData();
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast({
        title: "Error",
        description: "Failed to unsubscribe user",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading newsletter data...</div>;
  }

  const activeSubscribers = subscribers.filter(sub => sub.is_active);
  const totalSubscribers = subscribers.length;
  const avgOpenRate = campaigns.length > 0 
    ? campaigns.reduce((sum, camp) => sum + camp.open_rate, 0) / campaigns.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubscribers}</div>
            <p className="text-xs text-muted-foreground">
              {activeSubscribers.length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campaigns Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
            <p className="text-xs text-muted-foreground">
              Total campaigns created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgOpenRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Email engagement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Click Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.length > 0 
                ? (campaigns.reduce((sum, camp) => sum + camp.click_rate, 0) / campaigns.length).toFixed(1)
                : '0.0'
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              Link clicks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="subscribers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        </TabsList>

        <TabsContent value="subscribers">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Newsletter Subscribers</CardTitle>
                  <CardDescription>
                    Manage your email subscriber list
                  </CardDescription>
                </div>
                
                <Dialog open={isSubscriberDialogOpen} onOpenChange={setIsSubscriberDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Subscriber
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Subscriber</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="subEmail">Email *</Label>
                        <Input
                          id="subEmail"
                          type="email"
                          value={newSubscriber.email}
                          onChange={(e) => setNewSubscriber({...newSubscriber, email: e.target.value})}
                          placeholder="subscriber@example.com"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            value={newSubscriber.firstName}
                            onChange={(e) => setNewSubscriber({...newSubscriber, firstName: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            value={newSubscriber.lastName}
                            onChange={(e) => setNewSubscriber({...newSubscriber, lastName: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={newSubscriber.phone}
                          onChange={(e) => setNewSubscriber({...newSubscriber, phone: e.target.value})}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                      <Button onClick={handleAddSubscriber} className="w-full">
                        Add Subscriber
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subscribers.length === 0 ? (
                  <div className="text-center py-8">
                    <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No subscribers yet</h3>
                    <p className="text-muted-foreground">Add your first subscriber to get started</p>
                  </div>
                ) : (
                  subscribers.map((subscriber) => (
                    <div key={subscriber.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">
                            {subscriber.first_name} {subscriber.last_name} 
                          </h4>
                          <Badge variant={subscriber.is_active ? "default" : "secondary"}>
                            {subscriber.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{subscriber.email}</p>
                        {subscriber.phone && (
                          <p className="text-sm text-muted-foreground">{subscriber.phone}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Joined: {new Date(subscriber.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      
                      {subscriber.is_active && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnsubscribe(subscriber.id)}
                        >
                          <UserMinus className="h-4 w-4 mr-2" />
                          Unsubscribe
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Email Campaigns</CardTitle>
                  <CardDescription>
                    Create and manage your email marketing campaigns
                  </CardDescription>
                </div>
                
                <Dialog open={isCampaignDialogOpen} onOpenChange={setIsCampaignDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Campaign
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create Email Campaign</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="campaignName">Campaign Name *</Label>
                        <Input
                          id="campaignName"
                          value={newCampaign.name}
                          onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                          placeholder="e.g., Monthly Market Update"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subjectLine">Subject Line *</Label>
                        <Input
                          id="subjectLine"
                          value={newCampaign.subject}
                          onChange={(e) => setNewCampaign({...newCampaign, subject: e.target.value})}
                          placeholder="e.g., Your Neighborhood Market Update"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emailContent">Email Content *</Label>
                        <Textarea
                          id="emailContent"
                          rows={8}
                          value={newCampaign.content}
                          onChange={(e) => setNewCampaign({...newCampaign, content: e.target.value})}
                          placeholder="Write your email content here..."
                        />
                      </div>
                      <Button onClick={handleCreateCampaign} className="w-full">
                        Create Campaign (Draft)
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.length === 0 ? (
                  <div className="text-center py-8">
                    <Send className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
                    <p className="text-muted-foreground">Create your first email campaign</p>
                  </div>
                ) : (
                  campaigns.map((campaign) => (
                    <div key={campaign.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold">{campaign.campaign_name}</h4>
                          <p className="text-sm text-muted-foreground">{campaign.subject_line}</p>
                        </div>
                        <Badge variant={campaign.status === 'sent' ? 'default' : 'secondary'}>
                          {campaign.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Recipients:</span>
                          <div className="font-medium">{campaign.recipients_count}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Open Rate:</span>
                          <div className="font-medium">{campaign.open_rate?.toFixed(1) || 0}%</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Click Rate:</span>
                          <div className="font-medium">{campaign.click_rate?.toFixed(1) || 0}%</div>
                        </div>
                      </div>
                      
                      {campaign.sent_at && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Sent: {new Date(campaign.sent_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NewsletterManagement;