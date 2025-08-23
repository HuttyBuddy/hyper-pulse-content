import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cleanupAuthState } from "@/lib/auth";
import { useToast } from "@/components/ui/use-toast";
import { MessageCircle } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";
import { cn } from "@/lib/utils";

const AppHeader = () => {
  const [profile, setProfile] = useState<{ name?: string | null; headshot_url?: string | null; logo_url?: string | null } | null>(null);
  const { toggleChat, isOpen, messages } = useChat();
  
  // Count unread messages (assistant messages that came after the chat was closed)
  const unreadCount = messages.filter(m => !m.isUser).length;

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('name, headshot_url, logo_url')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!ignore) setProfile(data);
    };
    load();
    return () => { ignore = true; };
  }, []);

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    return parts.slice(0, 2).map(p => p[0].toUpperCase()).join('') || 'U';
  };

  const onLogoClick = () => {
    if (isUploadingLogo) return;
    fileInputRef.current?.click();
  };

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Not signed in", description: "Please sign in to upload a logo." });
        return;
      }
      const path = `${user.id}/logo-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('branding').upload(path, file, {
        upsert: true,
        contentType: file.type,
      });
      if (uploadError) {
        toast({ title: "Upload failed", description: uploadError.message });
        return;
      }
      const { data: publicData } = supabase.storage.from('branding').getPublicUrl(path);
      const publicUrl = publicData.publicUrl;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ logo_url: publicUrl })
        .eq('user_id', user.id);
      if (updateError) {
        toast({ title: "Save failed", description: updateError.message });
        return;
      }
      setProfile((prev) => ({ ...(prev ?? {}), logo_url: publicUrl }));
      toast({ title: "Logo updated", description: "Your logo has been saved." });
    } finally {
      setIsUploadingLogo(false);
      e.currentTarget.value = "";
    }
  };

  const handleSignOut = async () => {
    try {
      cleanupAuthState();
      try { await supabase.auth.signOut({ scope: 'global' }); } catch {}
    } finally {
      window.location.href = '/';
    }
  };
  return (
    <header className="h-14 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container h-full flex items-center justify-between px-4">
        <Link to="/dashboard" className="text-lg md:text-xl font-semibold tracking-tight">
          <span className="hidden sm:inline">The Hyper‑Local Pulse</span>
          <span className="sm:hidden">Hyper‑Local</span>
        </Link>
        <div className="flex items-center gap-2">
          {/* Mobile: Show only essential buttons */}
          <div className="flex md:hidden gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleChat}
              className={cn(
                "relative",
                isOpen && "bg-muted text-muted-foreground"
              )}
            >
              <MessageCircle className="h-4 w-4" />
              {unreadCount > 0 && !isOpen && (
                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </Button>
          </div>
          
          {/* Desktop: Show full navigation */}
          <nav className="hidden md:flex gap-1">
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/profile">Profile</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleChat}
              className={cn(
                "relative",
                isOpen && "bg-muted text-muted-foreground"
              )}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Get AI Input
              {unreadCount > 0 && !isOpen && (
                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </Button>
          </nav>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>Log out</Button>
          <button
            type="button"
            onClick={onLogoClick}
            aria-label="Upload logo image"
            className="focus:outline-none"
            disabled={isUploadingLogo}
            title={isUploadingLogo ? "Uploading..." : "Click to upload a new logo"}
          >
            <Avatar>
              {(profile?.headshot_url || profile?.logo_url) ? (
                <AvatarImage
                  src={profile?.logo_url ?? profile?.headshot_url ?? ''}
                  alt="Logo image"
                  className="object-cover"
                />
              ) : (
                <AvatarFallback>{getInitials(profile?.name)}</AvatarFallback>
              )}
            </Avatar>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
