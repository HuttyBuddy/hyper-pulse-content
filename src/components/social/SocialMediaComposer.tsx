import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ImageIcon, Hash, Send, Clock, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

interface SocialMediaComposerProps {
  onPostCreated?: () => void;
}

export const SocialMediaComposer = ({ onPostCreated }: SocialMediaComposerProps) => {
  const [content, setContent] = useState("");
  const [platform, setPlatform] = useState<string>("");
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [scheduledTime, setScheduledTime] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [currentHashtag, setCurrentHashtag] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const platforms = [
    { value: "facebook", label: "Facebook", icon: "📘" },
    { value: "instagram", label: "Instagram", icon: "📷" },
    { value: "linkedin", label: "LinkedIn", icon: "💼" },
    { value: "twitter", label: "Twitter", icon: "🐦" }
  ];

  const addHashtag = () => {
    if (currentHashtag.trim() && !hashtags.includes(currentHashtag.trim())) {
      setHashtags([...hashtags, currentHashtag.trim()]);
      setCurrentHashtag("");
    }
  };

  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter(h => h !== tag));
  };

  const getCharacterLimit = (platform: string) => {
    const limits = {
      twitter: 280,
      facebook: 2200,
      instagram: 2200,
      linkedin: 3000
    };
    return limits[platform as keyof typeof limits] || 2200;
  };

  const handleSubmit = async (action: 'draft' | 'schedule' | 'publish') => {
    if (!content.trim() || !platform) {
      toast("Please add content and select a platform");
      return;
    }

    if (action === 'schedule' && (!scheduledDate || !scheduledTime)) {
      toast("Please select a date and time for scheduling");
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let scheduledAt = null;
      if (action === 'schedule' && scheduledDate && scheduledTime) {
        const [hours, minutes] = scheduledTime.split(':');
        const dateTime = new Date(scheduledDate);
        dateTime.setHours(parseInt(hours), parseInt(minutes));
        scheduledAt = dateTime.toISOString();
      }

      const postData = {
        user_id: user.id,
        platform,
        post_content: content,
        scheduled_at: scheduledAt,
        status: action === 'publish' ? 'posted' : action === 'schedule' ? 'scheduled' : 'draft',
        posted_at: action === 'publish' ? new Date().toISOString() : null
      };

      const { error } = await supabase
        .from('social_media_posts')
        .insert(postData);

      if (error) throw error;

      toast(`Post ${action === 'publish' ? 'published' : action}d successfully!`);
      
      // Reset form
      setContent("");
      setPlatform("");
      setScheduledDate(undefined);
      setScheduledTime("");
      setHashtags([]);
      
      onPostCreated?.();
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast(`Failed to ${action} post: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPlatform = platforms.find(p => p.value === platform);
  const characterLimit = getCharacterLimit(platform);
  const remainingCharacters = characterLimit - content.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Post</CardTitle>
        <CardDescription>Compose and schedule your social media content</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Platform Selection */}
        <div>
          <Label>Platform</Label>
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger>
              <SelectValue placeholder="Select a platform" />
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

        {/* Content Textarea */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Content</Label>
            {platform && (
              <span className={cn(
                "text-sm",
                remainingCharacters < 0 ? "text-red-500" : remainingCharacters < 50 ? "text-yellow-500" : "text-muted-foreground"
              )}>
                {remainingCharacters} characters remaining
              </span>
            )}
          </div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening in your local market?"
            className="min-h-[120px]"
            maxLength={characterLimit}
          />
        </div>

        {/* Hashtags */}
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

        {/* Schedule Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Schedule Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !scheduledDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {scheduledDate ? format(scheduledDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={scheduledDate}
                  onSelect={setScheduledDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label>Schedule Time</Label>
            <Input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => handleSubmit('draft')}
            disabled={isLoading}
          >
            Save Draft
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleSubmit('schedule')}
            disabled={isLoading || !scheduledDate || !scheduledTime}
            className="gap-2"
          >
            <Clock className="w-4 h-4" />
            Schedule Post
          </Button>
          <Button
            onClick={() => handleSubmit('publish')}
            disabled={isLoading}
            className="gap-2"
          >
            <Send className="w-4 h-4" />
            Publish Now
          </Button>
        </div>

        {selectedPlatform && (
          <div className="text-sm text-muted-foreground">
            Posting to {selectedPlatform.icon} {selectedPlatform.label}
          </div>
        )}
      </CardContent>
    </Card>
  );
};