import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Development mode bypass - set to true to skip authentication
const DEV_MODE = import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH !== 'false';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    // Skip auth check in development mode
    if (DEV_MODE) {
      setAuthed(true);
      setLoading(false);
      return;
    }

    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setAuthed(!!session?.user);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setAuthed(!!data.session?.user);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) return null;
  if (!authed) return <Navigate to="/" replace />;
  
  return (
    <>
      {DEV_MODE && (
        <div className="fixed top-0 left-0 z-50 bg-yellow-500 text-black px-3 py-1 text-sm font-medium">
          DEV MODE - Auth Bypassed
        </div>
      )}
      {children}
    </>
  );
};

export default ProtectedRoute;
