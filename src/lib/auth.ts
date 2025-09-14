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
  console.log('[AUTH] handleCriticalAuthError called with:', error);
  
  const errorMessage = error?.message || String(error);
  console.log('[AUTH] Error message:', errorMessage);
  
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
    'No authenticated user',
    'AuthSessionMissing'
  ];
  
  const isAuthError = authErrorPatterns.some(pattern => 
    errorMessage.toLowerCase().includes(pattern.toLowerCase())
  );
  
  console.log('[AUTH] Is auth error?', isAuthError);
  
  if (isAuthError) {
    console.log('[AUTH] Critical auth error detected, starting cleanup process');
    
    try {
      console.log('[AUTH] Step 1: Clearing local storage');
      // Import supabase client dynamically to avoid circular dependencies
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Clear authentication state
      cleanupAuthState();
      console.log('[AUTH] Step 2: Local storage cleared');
      
      // Sign out from Supabase
      console.log('[AUTH] Step 3: Signing out from Supabase');
      await supabase.auth.signOut();
      console.log('[AUTH] Step 4: Supabase signout complete');
      
      // Redirect to login page
      console.log('[AUTH] Step 5: Redirecting to login page');
      window.location.href = '/';
      console.log('[AUTH] Step 6: Redirect initiated');
    } catch (e) {
      console.error('[AUTH] Error during auth cleanup:', e);
      // If all else fails, just redirect
      console.log('[AUTH] Fallback: Direct redirect to login');
      window.location.href = '/';
    }
  } else {
    console.log('[AUTH] Not an auth error, ignoring');
  }
};