import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, BarChart3, User, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cleanupAuthState } from "@/lib/auth";
import { useToast } from "@/components/ui/use-toast";

const AppHeader = () => {
  const [profile, setProfile] = useState<{ name?: string | null; headshot_url?: string | null; logo_url?: string | null } | null>(null);

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
    <header className="h-16 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 sticky top-0 z-50 shadow-soft">
      <div className="container h-full flex items-center justify-between px-3 md:px-4">
        <Link to="/dashboard" className="text-base md:text-xl font-bold tracking-tight truncate hover:text-primary transition-colors">
          <span className="hidden sm:inline">The Hyper‑Local Pulse</span>
          <span className="sm:hidden">Hyper‑Local</span>
        </Link>
        <div className="flex items-center gap-1 md:gap-2">
          {/* Mobile navigation */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="sm" className="hover:bg-accent/80">
                <Menu className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] max-w-[85vw] glass">
              <nav className="flex flex-col gap-3 mt-6">
                <Button asChild variant="ghost" className="justify-start hover:bg-accent/80 transition-colors">
                  <Link to="/dashboard">
                    <Home className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="justify-start hover:bg-accent/80 transition-colors">
                  <Link to="/analytics">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="justify-start hover:bg-accent/80 transition-colors">
                  <Link to="/profile">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Link>
                </Button>
                <Button variant="ghost" className="justify-start mt-4 hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={handleSignOut}>
                  Log out
                </Button>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Desktop navigation */}
          <nav className="hidden md:flex gap-1">
            <Button asChild variant="ghost" size="sm" className="text-sm hover:bg-accent/80 transition-colors">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-sm hover:bg-accent/80 transition-colors">
              <Link to="/analytics">Analytics</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-sm hover:bg-accent/80 transition-colors">
              <Link to="/profile">Profile</Link>
            </Button>
          </nav>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="hidden md:flex text-sm hover:bg-destructive/10 hover:text-destructive transition-colors">
            Log out
          </Button>
          <button
            type="button"
            onClick={onLogoClick}
            aria-label="Upload logo image"
            className="focus:outline-none flex-shrink-0"
            disabled={isUploadingLogo}
            title={isUploadingLogo ? "Uploading..." : "Click to upload a new logo"}>
            <Avatar className="h-8 w-8 md:h-10 md:w-10 ring-2 ring-primary/20 hover:ring-primary/40 transition-all duration-200">
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
