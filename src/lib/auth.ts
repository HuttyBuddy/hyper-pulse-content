export const cleanupAuthState = () => {
  try {
    // Remove standard Supabase auth tokens
    localStorage.removeItem('supabase.auth.token');

    // Remove all Supabase-related keys from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });

    // Remove from sessionStorage if present
    if (typeof sessionStorage !== 'undefined') {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          sessionStorage.removeItem(key);
        }
      });
    }
  } catch (e) {
    // no-op
  }
};

export const handleCriticalAuthError = async (error: any) => {
  const errorMessage = error?.message || String(error);
  
  // Check for authentication-related error messages
  const authErrorPatterns = [
    'invalid claim',
    'missing sub claim',
    'unauthorized',
    'JWT expired',
    'Auth session missing',
    'token expired',
    'invalid token',
    'AuthSessionMissingError',
    'No authenticated user'
  ];
  
  const isAuthError = authErrorPatterns.some(pattern => 
    errorMessage.toLowerCase().includes(pattern.toLowerCase())
  );
  
  if (isAuthError) {
    console.log('Critical auth error detected, forcing logout:', errorMessage);
    try {
      // Import supabase client dynamically to avoid circular dependencies
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Clear authentication state
      cleanupAuthState();
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Redirect to login page
      window.location.href = '/';
    } catch (e) {
      console.error('Error during auth cleanup:', e);
      // If all else fails, just redirect
      window.location.href = '/';
    }
  }
};