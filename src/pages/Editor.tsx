import { Helmet } from "react-helmet-async";
import AppHeader from "@/components/layout/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";
import { useState } from "react";

const initialContent = `Carmichael continues to shine this month with steady buyer interest and well-priced listings moving quickly. Local favorites like the Jensen Botanical Garden and the American River Parkway keep lifestyle appeal strong. Median days on market remain competitive, and price reductions are modest compared to nearby zip codes.

In this week’s highlights, three newly remodeled ranch-style homes drew multiple offers within 7 days, while two premium properties with outdoor living spaces captured above-ask results. With mortgage rates stabilizing, seller confidence remains healthy and buyers are prioritizing move-in ready, energy-efficient upgrades.`;

const Editor = () => {
  const [content, setContent] = useState(initialContent);
  const [appendBranding, setAppendBranding] = useState(true);

  return (
    <>
      <Helmet>
        <title>Customize & Brand — The Hyper-Local Pulse</title>
        <meta name="description" content="Edit your blog content and append your branding before exporting." />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : '/editor'} />
      </Helmet>
      <AppHeader />
      <main className="container py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Customize & Brand</h1>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => toast("Saved (demo)")}>Save Changes</Button>
            <Button variant="hero" onClick={() => toast("Exporting branded PDF… (demo)")}>Export Branded PDF</Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_360px]">
          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle>Newsletter / Blog Content</CardTitle>
              <CardDescription>Edit the text as needed</CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full min-h-[420px] rounded-md border border-input bg-background p-4 leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </CardContent>
          </Card>

          <aside>
            <Card className="shadow-elevated sticky top-24">
              <CardHeader>
                <CardTitle>Your Branding</CardTitle>
                <CardDescription>Assets and signature details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm mb-1">Agent Headshot</div>
                  <div className="h-28 rounded-md border bg-muted" />
                </div>
                <div>
                  <div className="text-sm mb-1">Brokerage Logo</div>
                  <div className="h-16 rounded-md border bg-muted" />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-medium">Append my branding to this post</div>
                    <div className="text-sm text-muted-foreground">Adds your headshot, logo and contact info to the footer</div>
                  </div>
                  <Switch checked={appendBranding} onCheckedChange={setAppendBranding} />
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </>
  );
};

export default Editor;
