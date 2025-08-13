import { Helmet } from "react-helmet-async";
import AppHeader from "@/components/layout/AppHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

import home1 from "@/assets/carmichael-home-1.jpg";
import home2 from "@/assets/carmichael-home-2.jpg";
import home3 from "@/assets/carmichael-home-3.jpg";
import lifestyleThumb from "@/assets/carmichael-lifestyle-thumb.jpg";
import marketThumb from "@/assets/market-update-thumb.jpg";

const ContentPackage = () => {
  const [tab, setTab] = useState("blog");
  const [imagePrompt, setImagePrompt] = useState("");
  const [videoPrompt, setVideoPrompt] = useState("");
  const [gallery, setGallery] = useState<string[]>([home1, home2, home3]);
  const [videoThumbs] = useState<string[]>([lifestyleThumb, marketThumb]);

  const [neighborhood, setNeighborhood] = useState("Carmichael");
  const [county, setCounty] = useState("Sacramento County");
  const [stateCode, setStateCode] = useState("CA");

  const { slugDate } = useParams();
  const [reportDate, setReportDate] = useState<Date | null>(null);
  const [neighborhoodSlug, setNeighborhoodSlug] = useState<string | null>(null);
  const [localReport, setLocalReport] = useState<any | null>(null);
  const [countyReport, setCountyReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("neighborhood, county, state")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        if ((data as any).neighborhood) setNeighborhood((data as any).neighborhood);
        if ((data as any).county) setCounty((data as any).county);
        if ((data as any).state) setStateCode((data as any).state);
      }
    };
    load();
  }, []);

  const fetchReports = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    let targetDate = new Date();
    let neighSlug = (neighborhood || '').toLowerCase().replace(/\s+/g, '-');
    if (slugDate) {
      const parts = slugDate.split('-');
      if (parts.length >= 4) {
        const yyyy = parts[parts.length - 3];
        const mm = parts[parts.length - 2];
        const dd = parts[parts.length - 1];
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          targetDate = parsed;
          neighSlug = parts.slice(0, parts.length - 3).join('-');
        }
      }
    }
    setNeighborhoodSlug(neighSlug);
    setReportDate(targetDate);
    setLoading(true);
    const dateStr = targetDate.toISOString().slice(0,10);
    const { data: localRows } = await supabase
      .from('market_reports')
      .select('*')
      .eq('user_id', user.id)
      .eq('location_type', 'neighborhood')
      .eq('neighborhood_slug', neighSlug)
      .lte('report_date', dateStr)
      .order('report_date', { ascending: false })
      .limit(1);
    setLocalReport(localRows?.[0] ?? null);
    if (county && stateCode) {
      const { data: countyRows } = await supabase
        .from('market_reports')
        .select('*')
        .eq('user_id', user.id)
        .eq('location_type', 'county')
        .eq('county', county)
        .eq('state', stateCode)
        .lte('report_date', dateStr)
        .order('report_date', { ascending: false })
        .limit(1);
      setCountyReport(countyRows?.[0] ?? null);
    } else {
      setCountyReport(null);
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    toast("Refreshing content…");
    await fetchReports();
    toast("Content updated");
  };

  useEffect(() => {
    fetchReports();
  }, [slugDate, neighborhood, county, stateCode]);

  const resolvedDate = (localReport?.report_date as any) ?? (reportDate ? reportDate.toISOString().slice(0,10) : undefined);
  const titleDate = resolvedDate ? format(new Date(resolvedDate), "MMMM d, yyyy") : "Latest";
  const displayNeighborhood = neighborhood || (neighborhoodSlug ? neighborhoodSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : "Your Area");
  const titleText = `${displayNeighborhood} Pulse: ${titleDate}`;

  const generateBlogBody = () => {
    const local = localReport;
    const countyR = countyReport;
    const nName = displayNeighborhood;
    const cName = county;

    const domLocal = local?.days_on_market != null ? `${local.days_on_market}` : "—";
    const domCounty = countyR?.days_on_market != null ? `${countyR.days_on_market}` : "—";
    const apsfLocal = local?.avg_price_per_sqft != null ? `$${Number(local.avg_price_per_sqft).toFixed(0)}/sf` : "—";
    const apsfCounty = countyR?.avg_price_per_sqft != null ? `$${Number(countyR.avg_price_per_sqft).toFixed(0)}/sf` : "—";
    const activeLocal = local?.active_listings ?? "—";
    const closedLocal = local?.closed_sales ?? "—";

    const lead = `${nName} is having a moment. From walkable streets to well-cared-for homes, demand remains solid while quality listings move quickly.`;

    return `**The ${nName} Real Estate Story ${titleDate !== 'Latest' ? 'This Period' : 'Now'}**

${lead}

**Key Market Snapshot**
- Median DOM — ${nName}: ${domLocal}${domCounty !== '—' ? ` vs ${cName}: ${domCounty}` : ""}.
- Active listings — ${nName}: ${activeLocal}.
- Closed sales — ${nName}: ${closedLocal}.
- Average price per sq ft — ${nName}: ${apsfLocal}${apsfCounty !== '—' ? ` vs ${cName}: ${apsfCounty}` : ""}.

**Context and What It Means**
Homes that are well-presented and priced to the market are attracting strong interest${local?.months_of_inventory ? `, with inventory at ${local.months_of_inventory} months` : ""}. Buyers continue to prioritize move‑in readiness, efficient systems, and inviting outdoor spaces.

**Looking Ahead**
If you’re considering selling, current conditions favor prepared listings. For buyers, ${nName} offers enduring value within ${cName}${stateCode ? `, ${stateCode}` : ""}.`;
  };

  const blogBody = generateBlogBody();

  const socialPosts = [
    `Just dropped your ${neighborhood} Pulse with ${county} context: fresh listings, trends, and what buyers want this week.`,
    `${neighborhood} lifestyle in 15 seconds—parks, coffee, community vibes—with ${county} market context.`,
    `Market snapshot: ${neighborhood} DOM vs ${county} median—DM for specifics.`,
    `Multiple offers in ${neighborhood}, steady pricing across ${county}. Thinking of selling?`,
    `Your next home could be closer than you think. ${neighborhood} highlights + ${county} benchmarks inside.`,
  ];

  const domLocal = localReport?.days_on_market != null ? `${localReport.days_on_market}` : "—";
  const domCounty = countyReport?.days_on_market != null ? `${countyReport.days_on_market}` : "—";
  const activeLocal = localReport?.active_listings ?? "—";
  const closedLocal = localReport?.closed_sales ?? "—";

  const marketDataPoints = [
    `Report date: ${titleDate}`,
    `Median DOM — ${displayNeighborhood}: ${domLocal}${domCounty !== '—' ? ` | ${county}: ${domCounty}` : ''}`,
    `Active listings — ${displayNeighborhood}: ${activeLocal}`,
    `Closed sales — ${displayNeighborhood}: ${closedLocal}`,
    ...(localReport?.avg_price_per_sqft != null ? [`Avg price/sf — ${displayNeighborhood}: $${Number(localReport.avg_price_per_sqft).toFixed(0)}`] : []),
    ...(countyReport?.avg_price_per_sqft != null ? [`Avg price/sf — ${county}: $${Number(countyReport.avg_price_per_sqft).toFixed(0)}`] : []),
  ];

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast("Copied to clipboard");
  };

  const addGeneratedImage = () => {
    if (!imagePrompt.trim()) {
      toast("Enter a prompt first");
      return;
    }
    const next = [home1, home2, home3][Math.floor(Math.random() * 3)];
    setGallery((g) => [next, ...g]);
    toast("Generated image added to gallery");
  };

  const suggestImgPrompts = [
    `A beautiful, modern suburban home in ${neighborhood} on a sunny day.`,
    `Twilight exterior shot of a renovated ranch-style home in ${neighborhood}.`,
    `Bright kitchen interior with natural light and clean finishes in ${neighborhood}.`,
  ];

  const suggestVideoPrompts = [
    `Create a 15-second video montage of the ${neighborhood} lifestyle with ${county} context: parks, local shops, friendly neighborhoods.`,
    `Generate a 30-second market update video comparing ${neighborhood} to ${county}.`,
  ];

  return (
    <>
      <Helmet>
        <title>Content Package — {titleText}</title>
        <meta name="description" content={`In-depth ${neighborhood} and ${county} market insights, content, and media.`} />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : '/content'} />
      </Helmet>
      <AppHeader />
      <main className="container py-8">
        <header className="mb-6 flex items-center justify-between gap-3">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{titleText}</h1>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading} aria-label="Refresh content package">
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </header>

        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="blog">Newsletter / Blog</TabsTrigger>
            <TabsTrigger value="social">Social Media Posts</TabsTrigger>
            <TabsTrigger value="media">AI Media</TabsTrigger>
            <TabsTrigger value="market">Market Data</TabsTrigger>
          </TabsList>

          <TabsContent value="blog">
            <Card className="shadow-elevated">
              <CardHeader>
                <CardTitle>{titleText}</CardTitle>
                <CardDescription>Detailed insights. {loading ? "Loading data…" : `Based on latest data as of ${titleDate}.`}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-left">
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: blogBody
                      .replace(/\*\*(.*?)\*\*/g, '<h3 class="text-lg font-semibold mt-6 mb-3 text-foreground">$1</h3>')
                      .replace(/\n\n/g, '</p><p class="text-muted-foreground leading-relaxed mb-4">')
                      .replace(/^/, '<p class="text-muted-foreground leading-relaxed mb-4">')
                      .replace(/$/, '</p>') 
                  }} 
                />
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  <Button variant="secondary" onClick={() => copy(`${titleText}\n\n${blogBody}`)}>Copy Full Text</Button>
                  <Button variant="outline" onClick={() => toast("Exporting PDF… (demo)")}>Export as PDF</Button>
                  <Button asChild variant="hero">
                    <Link to="/editor">Customize & Brand</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="social">
            <div className="grid gap-4 md:grid-cols-2">
              {socialPosts.map((text, i) => (
                <Card key={i} className="shadow-elevated">
                  <CardHeader>
                    <CardTitle className="text-base">Post {i + 1}</CardTitle>
                    <CardDescription>Ready to copy</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="aspect-video w-full overflow-hidden rounded-md bg-muted">
                      <img src={[home1, home2, home3][i % 3]} alt={`${neighborhood} real estate post image`} className="h-full w-full object-cover" loading="lazy" />
                    </div>
                    <p className="text-sm text-foreground">{text}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => copy(text)}>Copy Text</Button>
                      <Button size="sm" variant="outline" onClick={() => setTab("media")}>Add AI Image</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="media">
            <div className="grid gap-6">
              <section>
                <h3 className="text-lg font-semibold mb-2">AI Image Studio (powered by Imagen)</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {suggestImgPrompts.map((p) => (
                    <Button key={p} size="sm" variant="secondary" onClick={() => setImagePrompt(p)}>
                      {p}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2 items-center">
                  <Input placeholder="Describe the image you want…" value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} />
                  <Button variant="hero" onClick={addGeneratedImage}>Generate Image</Button>
                </div>
                <div className="grid gap-3 grid-cols-2 md:grid-cols-3 mt-4">
                  {gallery.map((src, idx) => (
                    <Card key={idx}>
                      <CardContent className="p-2">
                        <img src={src} alt={`Generated AI image for ${neighborhood}`} className="w-full h-40 object-cover rounded" loading="lazy" />
                        <div className="pt-2">
                          <Button size="sm" variant="secondary" onClick={() => toast("Downloading… (demo)")}>Download</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-2">AI Video Studio (powered by Veo)</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {suggestVideoPrompts.map((p) => (
                    <Button key={p} size="sm" variant="secondary" onClick={() => setVideoPrompt(p)}>
                      {p}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2 items-center">
                  <Input placeholder="Describe the video you want…" value={videoPrompt} onChange={(e) => setVideoPrompt(e.target.value)} />
                  <Button variant="hero" onClick={() => toast("Generating video… (demo)")}>Generate Video</Button>
                </div>
                <div className="grid gap-3 grid-cols-2 md:grid-cols-3 mt-4">
                  {videoThumbs.map((src, idx) => (
                    <Card key={idx}>
                      <CardContent className="p-2">
                        <img src={src} alt={`Generated AI video thumbnail for ${neighborhood}`} className="w-full h-40 object-cover rounded" loading="lazy" />
                        <div className="pt-2 flex gap-2">
                          <Button size="sm" variant="secondary" onClick={() => toast("Preview… (demo)")}>Preview</Button>
                          <Button size="sm" variant="outline" onClick={() => toast("Downloading… (demo)")}>Download</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            </div>
          </TabsContent>

          <TabsContent value="market">
            <Card className="shadow-elevated">
              <CardHeader>
                <CardTitle>Source Data</CardTitle>
                <CardDescription>Raw data points used to generate this report</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  {marketDataPoints.map((pt) => (
                    <li key={pt}>{pt}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
};

export default ContentPackage;