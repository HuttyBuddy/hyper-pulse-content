export const cleanupAuthState = () => {
  try {
    console.log('[AUTH] Starting aggressive cleanup of all storage');
    
    // Clear ALL localStorage (aggressive approach)
    const localStorageKeys = Object.keys(localStorage);
    console.log('[AUTH] Found localStorage keys:', localStorageKeys);
    localStorage.clear();
    console.log('[AUTH] localStorage cleared completely');
    
    // Clear ALL sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      const sessionStorageKeys = Object.keys(sessionStorage);
      console.log('[AUTH] Found sessionStorage keys:', sessionStorageKeys);
      sessionStorage.clear();
      console.log('[AUTH] sessionStorage cleared completely');
    }
    
    // Clear any cookies that might contain auth data
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    console.log('[AUTH] Cookies cleared');
  } catch (e) {
    console.error('[AUTH] Error during cleanup:', e);
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
    "AuthSessionMissing",
    "Auth session missing"
  ];
  
  const isAuthError = authErrorPatterns.some(pattern => 
    errorMessage.toLowerCase().includes(pattern.toLowerCase())
  );
  
  console.log('[AUTH] Is auth error?', isAuthError);
  
  if (isAuthError) {
    console.log('[AUTH] Critical auth error detected, starting cleanup process');
    console.log('[AUTH] Original error:', error);
    
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
      console.log('[AUTH] Step 5: Forcing redirect to login page');
      window.location.replace('/');
      console.log('[AUTH] Step 6: Redirect replace initiated');
    } catch (e) {
      console.error('[AUTH] Error during auth cleanup:', e);
      // If all else fails, just redirect
      console.log('[AUTH] Fallback: Direct redirect to login');
      window.location.replace('/');
    }
  } else {
    console.log('[AUTH] Not an auth error, ignoring');
  }
};