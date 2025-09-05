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
  Users, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign, 
  Filter,
  Plus,
  Edit,
  Trash2
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";

interface Lead {
  id: string;
  lead_source: string;
  lead_medium: string;
  lead_data: any;
  lead_value: number;
  status: string;
  follow_up_date: string;
  notes: string;
  created_at: string;
}

const statusColors = {
  'new': 'bg-blue-500',
  'contacted': 'bg-yellow-500', 
  'qualified': 'bg-purple-500',
  'converted': 'bg-green-500',
  'lost': 'bg-red-500'
};

const LeadManagement = () => {
  const isMobile = useIsMobile();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newLead, setNewLead] = useState({
    source: 'newsletter_signup',
    medium: 'direct',
    name: '',
    email: '',
    phone: '',
    value: '',
    notes: ''
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [leads, statusFilter, searchTerm]);

  const fetchLeads = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('lead_generation_tracking')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: "Error",
        description: "Failed to fetch leads",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterLeads = () => {
    let filtered = leads;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(lead => {
        const leadData = lead.lead_data || {};
        const searchText = `${leadData.name || ''} ${leadData.email || ''} ${lead.lead_source}`.toLowerCase();
        return searchText.includes(searchTerm.toLowerCase());
      });
    }

    setFilteredLeads(filtered);
  };

  const handleAddLead = async () => {
    if (!newLead.name || !newLead.email) {
      toast({
        title: "Missing Information",
        description: "Name and email are required",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('lead_generation_tracking')
        .insert({
          user_id: user.id,
          lead_source: newLead.source,
          lead_medium: newLead.medium,
          lead_data: {
            name: newLead.name,
            email: newLead.email,
            phone: newLead.phone
          },
          lead_value: parseFloat(newLead.value) || 0,
          status: 'new',
          notes: newLead.notes
        });

      if (error) throw error;

      toast({
        title: "Lead Added",
        description: "New lead has been added successfully"
      });

      setNewLead({
        source: 'newsletter_signup',
        medium: 'direct', 
        name: '',
        email: '',
        phone: '',
        value: '',
        notes: ''
      });
      setIsDialogOpen(false);
      fetchLeads();
    } catch (error) {
      console.error('Error adding lead:', error);
      toast({
        title: "Error",
        description: "Failed to add lead",
        variant: "destructive"
      });
    }
  };

  const handleUpdateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('lead_generation_tracking')
        .update({ status: newStatus })
        .eq('id', leadId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: "Lead status has been updated"
      });

      fetchLeads();
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({
        title: "Error", 
        description: "Failed to update lead status",
        variant: "destructive"
      });
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from('lead_generation_tracking')
        .delete()
        .eq('id', leadId);

      if (error) throw error;

      toast({
        title: "Lead Deleted",
        description: "Lead has been removed"
      });

      fetchLeads();
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast({
        title: "Error",
        description: "Failed to delete lead",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading leads...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className={`${isMobile ? 'space-y-4' : 'flex justify-between items-center'}`}>
        <div>
          <h2 className={`font-bold ${isMobile ? 'text-xl' : 'text-2xl'}`}>Lead Management</h2>
          <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>Manage and track your leads through the sales funnel</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent className={isMobile ? "max-w-[95vw] mx-2" : ""}>
            <DialogHeader>
              <DialogTitle>Add New Lead</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                <div className="space-y-2">
                  <Label htmlFor="leadSource">Source</Label>
                  <Select value={newLead.source} onValueChange={(value) => setNewLead({...newLead, source: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newsletter_signup">Newsletter Signup</SelectItem>
                      <SelectItem value="property_valuation">Property Valuation</SelectItem>
                      <SelectItem value="consultation_request">Consultation Request</SelectItem>
                      <SelectItem value="download">Content Download</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leadMedium">Medium</Label>
                  <Select value={newLead.medium} onValueChange={(value) => setNewLead({...newLead, medium: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blog_post">Blog Post</SelectItem>
                      <SelectItem value="social_media">Social Media</SelectItem>
                      <SelectItem value="email_campaign">Email Campaign</SelectItem>
                      <SelectItem value="direct">Direct</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="leadName">Name *</Label>
                <Input
                  id="leadName"
                  value={newLead.name}
                  onChange={(e) => setNewLead({...newLead, name: e.target.value})}
                  placeholder="Lead's full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leadEmail">Email *</Label>
                <Input
                  id="leadEmail"
                  type="email"
                  value={newLead.email}
                  onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                  placeholder="lead@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leadPhone">Phone</Label>
                <Input
                  id="leadPhone"
                  value={newLead.phone}
                  onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leadValue">Estimated Value ($)</Label>
                <Input
                  id="leadValue"
                  type="number"
                  value={newLead.value}
                  onChange={(e) => setNewLead({...newLead, value: e.target.value})}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leadNotes">Notes</Label>
                <Textarea
                  id="leadNotes"
                  value={newLead.notes}
                  onChange={(e) => setNewLead({...newLead, notes: e.target.value})}
                  placeholder="Additional information about this lead..."
                />
              </div>
              <Button onClick={handleAddLead} className="w-full">
                Add Lead
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2'}`}>
            <div className="space-y-2">
              <Label>Status Filter</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                placeholder="Search by name, email, or source..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads List */}
      <div className="grid gap-4">
        {filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No leads found</h3>
              <p className="text-muted-foreground">
                {leads.length === 0 ? "Add your first lead to get started" : "Try adjusting your filters"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredLeads.map((lead) => (
            <Card key={lead.id}>
              <CardContent className="py-4">
                <div className={`${isMobile ? 'space-y-4' : 'flex justify-between items-start'}`}>
                  <div className="flex-1">
                    <div className={`flex items-center gap-3 mb-2 ${isMobile ? 'flex-wrap' : ''}`}>
                      <h3 className="font-semibold">
                        {lead.lead_data?.name || 'Unknown Lead'}
                      </h3>
                      <Badge 
                        className={`text-white ${statusColors[lead.status as keyof typeof statusColors]}`}
                      >
                        {lead.status}
                      </Badge>
                    </div>
                    
                    <div className="grid gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {lead.lead_data?.email}
                      </div>
                      {lead.lead_data?.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {lead.lead_data.phone}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Value: ${lead.lead_value?.toLocaleString() || 0}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Created: {new Date(lead.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    {lead.notes && (
                      <p className="mt-2 text-sm bg-muted p-2 rounded">
                        {lead.notes}
                      </p>
                    )}
                  </div>

                  <div className={`flex gap-2 ${isMobile ? 'w-full justify-between' : 'ml-4'}`}>
                    <Select 
                      value={lead.status}
                      onValueChange={(value) => handleUpdateLeadStatus(lead.id, value)}
                    >
                      <SelectTrigger className={isMobile ? "flex-1" : "w-32"}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                        <SelectItem value="converted">Converted</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteLead(lead.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default LeadManagement;