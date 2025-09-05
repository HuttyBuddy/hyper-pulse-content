import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/use-subscription";
import { 
  BarChart3, 
  FileText, 
  Edit3, 
  Users, 
  ImageIcon, 
  Crown,
  Settings
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: BarChart3
  },
  {
    name: "Content Creator",
    href: "/content-package",
    icon: FileText
  },
  {
    name: "Editor",
    href: "/editor",
    icon: Edit3
  },
  {
    name: "Image Studio",
    href: "/image-studio",
    icon: ImageIcon,
    premium: true
  },
  {
    name: "Social Media",
    href: "/social-media-manager",
    icon: Users,
    premium: true
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    premium: true
  }
];

export default function MainNavigation() {
  const location = useLocation();
  const { isSubscribed } = useSubscription();

  return (
    <nav className="space-y-1">
      {navigation.map((item) => {
        const isActive = location.pathname === item.href;
        const needsUpgrade = item.premium && !isSubscribed;
        
        return (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
              needsUpgrade && "opacity-60"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
            {item.premium && (
              <Crown className="h-3 w-3 text-primary" />
            )}
            {needsUpgrade && (
              <Badge variant="outline" className="text-xs">
                Premium
              </Badge>
            )}
          </Link>
        );
      })}
      
      <div className="pt-4 mt-4 border-t">
        <Link
          to="/profile"
          className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
            location.pathname === "/profile"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        
        <Link
          to="/manage-subscription"
          className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
            location.pathname === "/manage-subscription"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <Crown className="h-4 w-4" />
          Subscription
          {!isSubscribed && (
            <Badge variant="secondary" className="text-xs">
              Free
            </Badge>
          )}
        </Link>
      </div>
    </nav>
  );
}