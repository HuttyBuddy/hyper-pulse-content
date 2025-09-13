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
import { CalendarIcon, ImageIcon, Hash, Send, Clock, X, Repeat, Copy } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

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
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState({
    frequency: 'weekly', // daily, weekly, monthly
    interval: 1, // every X days/weeks/months
    endDate: undefined as Date | undefined,
    maxOccurrences: 10
  });
  const [bulkPosts, setBulkPosts] = useState<string[]>([]);
  const [showBulkMode, setShowBulkMode] = useState(false);

  const platforms = [
    { value: "facebook", label: "Facebook", icon: "📘" },
    { value: "instagram", label: "Instagram", icon: "📷" },
    { value: "linkedin", label: "LinkedIn", icon: "💼" },
    { value: "twitter", label: "X", icon: "𝕏" }
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

  const addBulkPost = () => {
    if (content.trim()) {
      setBulkPosts([...bulkPosts, content.trim()]);
      setContent("");
    }
  };

  const removeBulkPost = (index: number) => {
    setBulkPosts(bulkPosts.filter((_, i) => i !== index));
  };

  const handleSubmit = async (action: 'draft' | 'schedule' | 'publish') => {
    const postsToProcess = showBulkMode ? bulkPosts : [content];
    
    if (postsToProcess.length === 0 || !platform) {
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

      // Process each post
      const results = [];
      for (let i = 0; i < postsToProcess.length; i++) {
        const postContent = postsToProcess[i];
        let postScheduledAt = scheduledAt;
        
        // For bulk posts, space them out by 1 hour
        if (showBulkMode && scheduledAt && i > 0) {
          const baseDate = new Date(scheduledAt);
          baseDate.setHours(baseDate.getHours() + i);
          postScheduledAt = baseDate.toISOString();
        }

        const postData = {
          user_id: user.id,
          platform,
          post_content: postContent,
          scheduled_at: postScheduledAt,
          status: action === 'publish' ? 'posted' : action === 'schedule' ? 'scheduled' : 'draft',
          posted_at: action === 'publish' ? new Date().toISOString() : null,
          recurrence_pattern: isRecurring ? recurrencePattern : null,
          auto_generated: false
        };

        const { data: insertedPost, error } = await supabase
          .from('social_media_posts')
          .insert(postData)
          .select()
          .single();

        if (error) throw error;
        results.push(insertedPost);
      }

      const successMessage = showBulkMode 
        ? `${results.length} posts ${action === 'publish' ? 'published' : action}d successfully!`
        : `Post ${action === 'publish' ? 'published' : action}d successfully!`;
      
      toast(successMessage);
      
      // Reset form
      setContent("");
      setPlatform("");
      setScheduledDate(undefined);
      setScheduledTime("");
      setHashtags([]);
      setBulkPosts([]);
      setIsRecurring(false);
      setShowBulkMode(false);
      
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
        {/* Mode Toggle */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={!showBulkMode}
              onCheckedChange={(checked) => setShowBulkMode(!(checked as boolean))}
            />
            <Label>Single Post</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={showBulkMode}
              onCheckedChange={(checked) => setShowBulkMode(checked as boolean)}
            />
            <Label>Bulk Posts</Label>
          </div>
        </div>

        <Separator />

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

        {/* Content Input */}
        {showBulkMode ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Add Posts to Queue</Label>
              <Badge variant="outline">{bulkPosts.length} posts queued</Badge>
            </div>
            <div className="space-y-3">
              <Textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Write a post and click 'Add to Queue'"
                className="min-h-[100px]"
                maxLength={characterLimit}
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={addBulkPost}
                disabled={!content.trim()}
                className="w-full"
              >
                <Copy className="w-4 h-4 mr-2" />
                Add to Queue
              </Button>
            </div>
            
            {bulkPosts.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                <Label>Queued Posts ({bulkPosts.length})</Label>
                {bulkPosts.map((post, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 border rounded text-sm">
                    <span className="flex-1 line-clamp-2">{post}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBulkPost(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
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
              onChange={e => setContent(e.target.value)}
              placeholder="What's happening in your local market?"
              className="min-h-[120px]"
              maxLength={characterLimit}
            />
          </div>
        )}

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

        {/* Recurring Options */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isRecurring}
              onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
            />
            <Label>Make this a recurring post</Label>
          </div>

          {isRecurring && (
            <Card className="bg-muted/30">
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select 
                      value={recurrencePattern.frequency} 
                      onValueChange={(value) => setRecurrencePattern({...recurrencePattern, frequency: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Repeat every</Label>
                    <Input
                      type="number"
                      min="1"
                      max="30"
                      value={recurrencePattern.interval}
                      onChange={(e) => setRecurrencePattern({
                        ...recurrencePattern, 
                        interval: parseInt(e.target.value) || 1
                      })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Maximum occurrences</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={recurrencePattern.maxOccurrences}
                    onChange={(e) => setRecurrencePattern({
                      ...recurrencePattern, 
                      maxOccurrences: parseInt(e.target.value) || 10
                    })}
                  />
                </div>
                
                <div className="text-xs text-muted-foreground bg-background p-2 rounded">
                  <Repeat className="w-3 h-3 inline mr-1" />
                  This will create {recurrencePattern.maxOccurrences} posts, 
                  one every {recurrencePattern.interval} {recurrencePattern.frequency.slice(0, -2)}
                  {recurrencePattern.interval > 1 ? 's' : ''}
                </div>
              </CardContent>
            </Card>
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
            disabled={isLoading || (!showBulkMode && !content.trim()) || (showBulkMode && bulkPosts.length === 0) || !scheduledDate || !scheduledTime}
            className="gap-2"
          >
            <Clock className="w-4 h-4" />
            {showBulkMode ? `Schedule ${bulkPosts.length} Posts` : 'Schedule Post'}
          </Button>
          <Button
            onClick={() => handleSubmit('publish')}
            disabled={isLoading || (!showBulkMode && !content.trim()) || (showBulkMode && bulkPosts.length === 0)}
            className="gap-2"
          >
            <Send className="w-4 h-4" />
            {showBulkMode ? `Publish ${bulkPosts.length} Posts` : 'Publish Now'}
          </Button>
        </div>

        {selectedPlatform && (
          <div className="text-sm text-muted-foreground">
            {showBulkMode ? `Bulk posting ${bulkPosts.length} posts to` : 'Posting to'} {selectedPlatform.icon} {selectedPlatform.label}
            {isRecurring && (
              <span className="ml-2">
                • Recurring {recurrencePattern.frequency} ({recurrencePattern.maxOccurrences}x)
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};