import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cleanupAuthState } from "@/lib/auth";

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

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    return parts.slice(0, 2).map(p => p[0].toUpperCase()).join('') || 'U';
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
      <div className="container h-full flex items-center justify-between">
        <Link to="/dashboard" className="text-lg font-semibold tracking-tight">
          The Hyper‑Local Pulse
        </Link>
        <div className="flex items-center gap-2">
          <nav className="hidden md:flex gap-1">
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/profile">Profile</Link>
            </Button>
          </nav>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>Log out</Button>
          <Link to="/profile" aria-label="Open profile to update avatar" className="focus:outline-none">
            <Avatar>
              {(profile?.headshot_url || profile?.logo_url) ? (
                <AvatarImage src={profile?.headshot_url ?? profile?.logo_url ?? ''} alt="Profile image" />
              ) : (
                <AvatarFallback>{getInitials(profile?.name)}</AvatarFallback>
              )}
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
