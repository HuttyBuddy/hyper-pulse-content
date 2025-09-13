import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight, Edit, Trash2 } from "lucide-react";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

interface SocialMediaPost {
  id: string;
  platform: string;
  post_content: string;
  scheduled_at: string | null;
  posted_at: string | null;
  status: string;
  engagement_metrics: any;
  created_at: string;
}

interface SocialMediaCalendarProps {
  posts: SocialMediaPost[];
  onPostsChange?: () => void;
}

export const SocialMediaCalendar = ({ posts, onPostsChange }: SocialMediaCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const getPlatformIcon = (platform: string) => {
    const icons = {
      facebook: "📘",
      instagram: "📷",
      linkedin: "💼",
      twitter: "𝕏"
    };
    return icons[platform as keyof typeof icons] || "📱";
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: "bg-gray-100 text-gray-800",
      scheduled: "bg-blue-100 text-blue-800",
      posted: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800"
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getPostsForDate = (date: Date) => {
    return posts.filter(post => {
      const postDate = post.scheduled_at ? new Date(post.scheduled_at) : 
                     post.posted_at ? new Date(post.posted_at) : null;
      return postDate && isSameDay(postDate, date);
    });
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    return eachDayOfInterval({ start, end });
  };

  const selectedDatePosts = getPostsForDate(selectedDate);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar View */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Content Calendar</CardTitle>
                <CardDescription>View and manage your scheduled posts</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('month')}
                >
                  Month
                </Button>
                <Button
                  variant={viewMode === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('week')}
                >
                  Week
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {format(selectedDate, 'MMMM yyyy')}
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border pointer-events-auto"
              components={{
                Day: ({ date, ...props }) => {
                  const dayPosts = getPostsForDate(date);
                  return (
                    <div className="relative">
                      <button {...props} className="w-full h-full">
                        <span>{date.getDate()}</span>
                        {dayPosts.length > 0 && (
                          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                            <div className="flex gap-1">
                              {dayPosts.slice(0, 3).map((post, idx) => (
                                <div
                                  key={idx}
                                  className="w-1.5 h-1.5 rounded-full bg-primary"
                                  title={`${post.platform} post`}
                                />
                              ))}
                              {dayPosts.length > 3 && (
                                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                              )}
                            </div>
                          </div>
                        )}
                      </button>
                    </div>
                  );
                }
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Selected Date Details */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>
              {format(selectedDate, 'EEEE, MMMM d')}
            </CardTitle>
            <CardDescription>
              {selectedDatePosts.length} post{selectedDatePosts.length !== 1 ? 's' : ''} scheduled
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedDatePosts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No posts scheduled for this date
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDatePosts.map((post) => (
                  <div key={post.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getPlatformIcon(post.platform)}</span>
                        <Badge className={getStatusColor(post.status)} variant="secondary">
                          {post.status}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm line-clamp-3 mb-2">{post.post_content}</p>
                    <div className="text-xs text-muted-foreground">
                      {post.scheduled_at && format(new Date(post.scheduled_at), 'h:mm a')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};