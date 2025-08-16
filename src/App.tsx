import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ChatProvider } from "@/contexts/ChatContext";
import ChatFloatingButton from "@/components/chat/ChatFloatingButton";
import ChatSheet from "@/components/chat/ChatSheet";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import ContentPackage from "./pages/ContentPackage";
import Editor from "./pages/Editor";
import Profile from "./pages/Profile";
import SignUp from "./pages/SignUp";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ManageSubscription from "./pages/ManageSubscription";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
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
                  <ChatFloatingButton />
                  <ChatSheet />
                </ChatProvider>
              </ProtectedRoute>
            } />
            <Route path="/content/:slugDate" element={
              <ProtectedRoute>
                <ChatProvider>
                  <ContentPackage />
                  <ChatFloatingButton />
                  <ChatSheet />
                </ChatProvider>
              </ProtectedRoute>
            } />
            <Route path="/content/:neighborhood" element={
              <ProtectedRoute>
                <ChatProvider>
                  <ContentPackage />
                  <ChatFloatingButton />
                  <ChatSheet />
                </ChatProvider>
              </ProtectedRoute>
            } />
            <Route path="/editor" element={
              <ProtectedRoute>
                <ChatProvider>
                  <Editor />
                  <ChatFloatingButton />
                  <ChatSheet />
                </ChatProvider>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ChatProvider>
                  <Profile />
                  <ChatFloatingButton />
                  <ChatSheet />
                </ChatProvider>
              </ProtectedRoute>
            } />
            <Route path="/manage-subscription" element={
              <ProtectedRoute>
                <ChatProvider>
                  <ManageSubscription />
                  <ChatFloatingButton />
                  <ChatSheet />
                </ChatProvider>
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
