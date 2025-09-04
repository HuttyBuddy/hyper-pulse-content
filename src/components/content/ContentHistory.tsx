import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { History, Copy, Eye, Trash2, Filter } from "lucide-react";

interface ContentHistoryItem {
  id: string;
  content_type: string;
  title: string;
  content: string;
  neighborhood: string;
  county: string;
  state: string;
  report_date: string;
  template_used?: string;
  created_at: string;
}

export const ContentHistory = () => {
  const [history, setHistory] = useState<ContentHistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<ContentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedContent, setSelectedContent] = useState<ContentHistoryItem | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    filterHistory();
  }, [history, searchTerm, typeFilter]);

  const fetchHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('content_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      toast.error("Failed to load content history");
    } else {
      setHistory(data || []);
    }
    setLoading(false);
  };

  const filterHistory = () => {
    let filtered = history;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.neighborhood.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(item => item.content_type === typeFilter);
    }

    setFilteredHistory(filtered);
  };

  const handleDeleteItem = async (itemId: string) => {
    const { error } = await supabase
      .from('content_history')
      .delete()
      .eq('id', itemId);

    if (error) {
      toast.error("Failed to delete content");
    } else {
      toast.success("Content deleted");
      fetchHistory();
    }
  };

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Content copied to clipboard");
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'blog': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'social': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'lifestyle': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'newsletter': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'blog': return 'Blog';
      case 'social': return 'Social';
      case 'lifestyle': return 'Lifestyle';
      case 'newsletter': return 'Newsletter';
      default: return type;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Content History
            </CardTitle>
            <CardDescription>View and manage your previously generated content</CardDescription>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="blog">Blog Posts</SelectItem>
              <SelectItem value="social">Social Media</SelectItem>
              <SelectItem value="lifestyle">Lifestyle Guide</SelectItem>
              <SelectItem value="newsletter">Newsletter</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading history...</div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm || typeFilter !== "all" 
              ? "No content matches your filters" 
              : "No content generated yet. Create your first content package!"
            }
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{item.title}</h3>
                      <Badge className={getTypeColor(item.content_type)}>
                        {getTypeLabel(item.content_type)}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>📍 {item.neighborhood}, {item.state}</p>
                      <p>📅 {format(new Date(item.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
                      {item.template_used && (
                        <p>📋 Template: {item.template_used}</p>
                      )}
                    </div>
                    <p className="text-sm mt-2 line-clamp-2">
                      {item.content.slice(0, 150)}...
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopyContent(item.content)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{item.title}</DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="max-h-96">
                        <div className="whitespace-pre-wrap text-sm">{item.content}</div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};