import { Link } from "react-router-dom";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 shadow-soft">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex flex-col items-center gap-2 md:flex-row md:gap-4">
            <p className="text-sm text-muted-foreground font-medium">
              © {currentYear} Hyper-Local Pulse. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <Link 
                to="/support" 
                className="text-muted-foreground hover:text-primary transition-colors hover:underline underline-offset-4"
              >
                Support
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link 
                to="/privacy" 
                className="text-muted-foreground hover:text-primary transition-colors hover:underline underline-offset-4"
              >
                Privacy Policy
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link 
                to="/terms" 
                className="text-muted-foreground hover:text-primary transition-colors hover:underline underline-offset-4"
              >
                Terms of Service
              </Link>
            </div>
          </div>
          <div className="text-sm text-muted-foreground font-medium">
            Built for real estate professionals
          </div>
        </div>
      </div>
    </footer>
  );
}