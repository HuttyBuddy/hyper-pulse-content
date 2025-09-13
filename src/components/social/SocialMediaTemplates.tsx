import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Copy, Hash, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

interface SocialMediaTemplate {
  id: string;
  name: string;
  platform: string;
  template_content: string;
  hashtags: string[];
  is_public: boolean;
  created_at: string;
}

export const SocialMediaTemplates = () => {
  const [templates, setTemplates] = useState<SocialMediaTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SocialMediaTemplate | null>(null);
  
  // Form state
  const [templateName, setTemplateName] = useState("");
  const [platform, setPlatform] = useState("");
  const [templateContent, setTemplateContent] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [currentHashtag, setCurrentHashtag] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  const platforms = [
    { value: "facebook", label: "Facebook", icon: "📘" },
    { value: "instagram", label: "Instagram", icon: "📷" },
    { value: "linkedin", label: "LinkedIn", icon: "💼" },
    { value: "twitter", label: "X", icon: "🐦" }
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('social_media_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      toast(`Failed to load templates: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTemplateName("");
    setPlatform("");
    setTemplateContent("");
    setHashtags([]);
    setCurrentHashtag("");
    setIsPublic(false);
    setEditingTemplate(null);
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !platform || !templateContent.trim()) {
      toast("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const templateData = {
        user_id: user.id,
        name: templateName,
        platform,
        template_content: templateContent,
        hashtags,
        is_public: isPublic
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from('social_media_templates')
          .update(templateData)
          .eq('id', editingTemplate.id)
          .eq('user_id', user.id);

        if (error) throw error;
        toast("Template updated successfully!");
      } else {
        const { error } = await supabase
          .from('social_media_templates')
          .insert(templateData);

        if (error) throw error;
        toast("Template created successfully!");
      }

      resetForm();
      setIsDialogOpen(false);
      fetchTemplates();
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast(`Failed to save template: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEditTemplate = (template: SocialMediaTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setPlatform(template.platform);
    setTemplateContent(template.template_content);
    setHashtags(template.hashtags || []);
    setIsPublic(template.is_public);
    setIsDialogOpen(true);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('social_media_templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast("Template deleted successfully!");
      fetchTemplates();
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast(`Failed to delete template: ${error.message}`);
    }
  };

  const handleCopyTemplate = (content: string) => {
    navigator.clipboard.writeText(content);
    toast("Template content copied to clipboard!");
  };

  const addHashtag = () => {
    if (currentHashtag.trim() && !hashtags.includes(currentHashtag.trim())) {
      setHashtags([...hashtags, currentHashtag.trim()]);
      setCurrentHashtag("");
    }
  };

  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter(h => h !== tag));
  };

  const getPlatformIcon = (platform: string) => {
    const icons = {
      facebook: "📘",
      instagram: "📷",
      linkedin: "💼",
      twitter: "🐦"
    };
    return icons[platform as keyof typeof icons] || "📱";
  };

  const getTypeColor = (platform: string) => {
    const colors = {
      facebook: "bg-blue-100 text-blue-800",
      instagram: "bg-pink-100 text-pink-800",
      linkedin: "bg-blue-100 text-blue-800",
      twitter: "bg-sky-100 text-sky-800"
    };
    return colors[platform as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Social Media Templates</h3>
          <p className="text-muted-foreground">Create reusable templates for your social media posts</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </DialogTitle>
              <DialogDescription>
                Create a reusable template for your social media posts
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Template Name</Label>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Weekly Market Update"
                />
              </div>
              
              <div>
                <Label>Platform</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        <div className="flex items-center gap-2">
                          <span>{p.icon}</span>
                          <span>{p.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Template Content</Label>
                <Textarea
                  value={templateContent}
                  onChange={(e) => setTemplateContent(e.target.value)}
                  placeholder="Write your template content here. Use {{neighborhood}} for dynamic content."
                  className="min-h-[120px]"
                />
              </div>

              <div>
                <Label>Hashtags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={currentHashtag}
                    onChange={(e) => setCurrentHashtag(e.target.value)}
                    placeholder="Add hashtag (without #)"
                    onKeyPress={(e) => e.key === 'Enter' && addHashtag()}
                  />
                  <Button type="button" onClick={addHashtag} size="sm">
                    <Hash className="w-4 h-4" />
                  </Button>
                </div>
                {hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {hashtags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        #{tag}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => removeHashtag(tag)} />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveTemplate} disabled={saving}>
                  {saving ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading templates...</div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">No templates created yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first template to speed up your content creation process
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getPlatformIcon(template.platform)}</span>
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <Badge className={getTypeColor(template.platform)} variant="secondary">
                        {template.platform}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyTemplate(template.template_content)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm line-clamp-3 mb-3">{template.template_content}</p>
                {template.hashtags && template.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {template.hashtags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                    {template.hashtags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.hashtags.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Created {new Date(template.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};