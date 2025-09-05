import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Helmet } from "react-helmet-async";
import { ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  canonical?: string;
}

export default function AppLayout({ children, title, description, canonical }: AppLayoutProps) {
  const defaultTitle = "Hyper-Local Pulse — Real Estate Marketing Platform";
  const defaultDescription = "AI-powered real estate marketing platform for creating personalized content, managing leads, and tracking ROI across multiple channels.";
  
  return (
    <ErrorBoundary>
      <Helmet>
        <title>{title || defaultTitle}</title>
        <meta name="description" content={description || defaultDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={canonical || (typeof window !== 'undefined' ? window.location.href : '/')} />
        
        {/* Open Graph tags */}
        <meta property="og:title" content={title || defaultTitle} />
        <meta property="og:description" content={description || defaultDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonical || (typeof window !== 'undefined' ? window.location.href : '/')} />
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title || defaultTitle} />
        <meta name="twitter:description" content={description || defaultDescription} />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        {children}
      </div>
    </ErrorBoundary>
  );
}