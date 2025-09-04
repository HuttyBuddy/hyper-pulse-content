import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
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
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ManageSubscription from "./pages/ManageSubscription";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
...
        </BrowserRouter>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
