import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ui/error-boundary";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { handleCriticalAuthError } from "@/lib/auth";
import { validateConfig, env } from "@/lib/config";
import { debugLog } from "@/lib/env";
import { ChatProvider } from "@/contexts/ChatContext";
import ChatSheet from "@/components/chat/ChatSheet";
import ChatFloatingButton from "@/components/chat/ChatFloatingButton";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import ContentPackage from "./pages/ContentPackage";
import Editor from "./pages/Editor";
import Profile from "./pages/Profile";
import SignUp from "./pages/SignUp";
import ImageStudio from "./pages/ImageStudio";
import SocialMediaManager from "./pages/SocialMediaManager";
import Analytics from "./pages/Analytics";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ManageSubscription from "./pages/ManageSubscription";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Support from "./pages/Support";
import ClientDashboard from "./pages/ClientDashboard";

const queryClient = new QueryClient();

const AuthStateManager = () => {
  useEffect(() => {
    debugLog('AUTH: Setting up global auth state listener');
    
    // Validate configuration on app start
    const configErrors = validateConfig();
    if (configErrors.length > 0) {
      console.error('Configuration errors detected:', configErrors);
    }
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        debugLog('AUTH: Auth state change detected:', event, session?.user?.id || 'no user');
        
        if (event === 'SIGNED_OUT') {
          debugLog('AUTH: User signed out, redirecting to login');
          window.location.replace('/');
        }
        
        if (event === 'TOKEN_REFRESHED' && !session) {
          debugLog('AUTH: Token refresh failed, handling as critical error');
          await handleCriticalAuthError('Token refresh failed');
        }
      }
    );

    // Listen for unhandled promise rejections that might be auth-related
    const handleUnhandledRejection = async (event: PromiseRejectionEvent) => {
      const error = event.reason;
      const errorMessage = error?.message || String(error);
      
      if (errorMessage.includes('AuthSessionMissingError') || 
          errorMessage.includes('Auth session missing')) {
        console.log('[AUTH] Caught unhandled auth error:', errorMessage);
        event.preventDefault();
        await handleCriticalAuthError(error);
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      debugLog('AUTH: Cleaning up global auth listeners');
      subscription.unsubscribe();
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <ErrorBoundary>
          <AuthStateManager />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <ChatProvider>
                    <Dashboard />
                    <ChatSheet />
                    <ChatFloatingButton />
                  </ChatProvider>
                </ProtectedRoute>
              } />
              <Route path="/content/:slugDate" element={
                <ProtectedRoute>
                  <ChatProvider>
                    <ErrorBoundary>
                      <ContentPackage />
                    </ErrorBoundary>
                    <ChatSheet />
                    <ChatFloatingButton />
                  </ChatProvider>
                </ProtectedRoute>
              } />
              <Route path="/content/:neighborhood" element={
                <ProtectedRoute>
                  <ChatProvider>
                    <ErrorBoundary>
                      <ContentPackage />
                    </ErrorBoundary>
                    <ChatSheet />
                    <ChatFloatingButton />
                  </ChatProvider>
                </ProtectedRoute>
              } />
              <Route path="/editor" element={
                <ProtectedRoute>
                  <ChatProvider>
                    <ErrorBoundary>
                      <Editor />
                    </ErrorBoundary>
                    <ChatSheet />
                    <ChatFloatingButton />
                  </ChatProvider>
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ChatProvider>
                    <Profile />
                    <ChatSheet />
                    <ChatFloatingButton />
                  </ChatProvider>
                </ProtectedRoute>
              } />
              <Route path="/image-studio" element={
                <ProtectedRoute>
                  <ChatProvider>
                    <ErrorBoundary>
                      <ImageStudio />
                    </ErrorBoundary>
                    <ChatSheet />
                    <ChatFloatingButton />
                  </ChatProvider>
                </ProtectedRoute>
              } />
              <Route path="/social-media" element={
                <ProtectedRoute>
                  <ChatProvider>
                    <ErrorBoundary>
                      <SocialMediaManager />
                    </ErrorBoundary>
                    <ChatSheet />
                    <ChatFloatingButton />
                  </ChatProvider>
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <ChatProvider>
                    <ErrorBoundary>
                      <Analytics />
                    </ErrorBoundary>
                    <ChatSheet />
                    <ChatFloatingButton />
                  </ChatProvider>
                </ProtectedRoute>
              } />
              <Route path="/manage-subscription" element={
                <ProtectedRoute>
                  <ChatProvider>
                    <ManageSubscription />
                    <ChatSheet />
                    <ChatFloatingButton />
                  </ChatProvider>
                </ProtectedRoute>
              } />
              <Route path="/support" element={<Support />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/shared/dashboard/:shareUrl" element={<ClientDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
