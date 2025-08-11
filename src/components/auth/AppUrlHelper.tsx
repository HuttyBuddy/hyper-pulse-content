import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useMemo } from "react";

// Small helper to surface the current app origin and let users copy it for Supabase URL settings
// Uses design system tokens via existing components
const AppUrlHelper = () => {
  const { toast } = useToast();

  const origin = useMemo(() => {
    if (typeof window !== "undefined") return window.location.origin;
    return "";
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(origin);
      toast({ title: "App URL copied", description: origin });
    } catch {
      toast({ title: "Could not copy URL", description: origin, variant: "destructive" });
    }
  };

  if (!origin) return null;

  return (
    <div className="mt-2 rounded-md border border-input bg-muted/30 p-3 text-xs text-muted-foreground">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="font-medium text-foreground/80">App URL</div>
          <div className="truncate" aria-label="Current app origin">{origin}</div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={copy}>Copy</Button>
          <a
            href={origin}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:text-foreground/90"
          >
            Open
          </a>
        </div>
      </div>
      <p className="mt-2">
        Use this in Supabase: set Site URL to this origin and add it to Additional Redirect URLs.
      </p>
    </div>
  );
};

export default AppUrlHelper;
