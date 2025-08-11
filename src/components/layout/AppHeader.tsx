import { Link } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cleanupAuthState } from "@/lib/auth";

const AppHeader = () => {
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
          <Avatar>
            <AvatarFallback>AM</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
