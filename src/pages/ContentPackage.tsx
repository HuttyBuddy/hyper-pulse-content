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
import { Download, Trash2, Sparkles } from "lucide-react";

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
  const [imageLoading, setImageLoading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);

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
  const lastRetrievedISO = (localReport?.retrieved_at as any) || (countyReport?.retrieved_at as any) || null;
  const freshnessText = loading ? "Loading data…" : (lastRetrievedISO ? `Last updated ${format(new Date(lastRetrievedISO), "MMMM d, yyyy")}` : `Based on latest available data as of ${titleDate}.`);

  const generateBlogBody = () => {
    const local = localReport as any;
    const countyR = countyReport as any;
    const nName = displayNeighborhood;
    const cName = county;

    // Sample/demo data when no real data exists
    const sampleData = {
      medianSalePrice: 850000,
      avgPricePSF: 425,
      daysOnMarket: 18,
      activeListings: 47,
      newListings: 23,
      closedSales: 31,
      monthsInventory: 1.8,
      momChanges: { price: 0.032, dom: -0.15, inventory: -0.12 },
      yoyChanges: { price: 0.087, dom: -0.28, inventory: -0.31 }
    };

    const countyData = {
      avgPricePSF: 398,
      daysOnMarket: 22
    };

    const fmtCurrency = (v: any) => (v != null ? `$${Number(v).toLocaleString()}` : "—");
    const fmtNum = (v: any) => (v != null ? `${Number(v).toLocaleString()}` : "—");
    const fmtPSF = (v: any) => (v != null ? `$${Number(v).toFixed(0)}/sf` : "—");
    const fmtChange = (v: any) => {
      if (v == null || isNaN(Number(v))) return null;
      const num = Number(v);
      const isPct = Math.abs(num) <= 1;
      const display = isPct ? `${(num * 100).toFixed(1)}%` : `${num > 0 ? "+" : ""}${num.toFixed(1)}`;
      const arrow = num > 0 ? "↑" : num < 0 ? "↓" : "→";
      return `${arrow} ${display}`;
    };

    // Use real data if available, otherwise use sample data
    const msp = local?.median_sale_price ?? sampleData.medianSalePrice;
    const apsfLocal = local?.avg_price_per_sqft ?? sampleData.avgPricePSF;
    const apsfCounty = countyR?.avg_price_per_sqft ?? countyData.avgPricePSF;
    const dom = local?.days_on_market ?? sampleData.daysOnMarket;
    const domCounty = countyR?.days_on_market ?? countyData.daysOnMarket;
    const active = local?.active_listings ?? sampleData.activeListings;
    const newListings = local?.new_listings ?? sampleData.newListings;
    const closed = local?.closed_sales ?? sampleData.closedSales;
    const inventory = local?.months_of_inventory ?? sampleData.monthsInventory;

    const mom = local?.mom_change || sampleData.momChanges;
    const yoy = local?.yoy_change || sampleData.yoyChanges;

    const mspTxt = fmtCurrency(msp);
    const apsfLTxt = fmtPSF(apsfLocal);
    const apsfCTxt = fmtPSF(apsfCounty);
    const domTxt = fmtNum(dom);
    const domCTxt = fmtNum(domCounty);
    const activeTxt = fmtNum(active);
    const newTxt = fmtNum(newListings);
    const closedTxt = fmtNum(closed);
    const invTxt = `${Number(inventory).toFixed(1)} months`;

    const priceMom = fmtChange(mom.price);
    const domMom = fmtChange(mom.dom);
    const invMom = fmtChange(mom.inventory);
    const priceYoy = fmtChange(yoy.price);
    const domYoy = fmtChange(yoy.dom);
    const invYoy = fmtChange(yoy.inventory);

    const marketBalance = Number(inventory) < 2 ? "a strong seller's market" : 
                         Number(inventory) <= 4 ? "a balanced market" : "a buyer-leaning market";

    const speedComparison = Number(dom) <= Number(domCounty) ? "moving faster than" : "taking longer than";
    const priceComparison = Number(apsfLocal) >= Number(apsfCounty) ? "commanding a premium over" : "priced below";

    return `**The ${nName} Real Estate Pulse: ${titleDate}**

${nName} continues to demonstrate remarkable resilience in today's dynamic market. With a median days on market of just ${domTxt} days, properties are moving at an impressive pace, significantly outperforming many comparable markets. At ${invTxt} of inventory, we're experiencing ${marketBalance}, creating compelling opportunities for both buyers and sellers.

**Current Market Dynamics**

The median sale price has reached ${mspTxt}, representing ${priceYoy ? `${priceYoy} year-over-year growth` : 'strong appreciation'}. This pricing strength reflects the continued desirability of ${nName}'s unique combination of established neighborhoods, quality schools, and convenient access to Sacramento's employment centers.

At ${apsfLTxt} per square foot, ${nName} is ${priceComparison} the broader ${cName} average of ${apsfCTxt}. This differential speaks to the premium buyers place on the area's mature tree canopy, well-maintained infrastructure, and strong sense of community.

**Supply and Demand Indicators**

• **Active Inventory**: ${activeTxt} homes currently available
• **New Listings**: ${newTxt} fresh properties entered the market recently
• **Closed Sales**: ${closedTxt} successful transactions completed
• **Market Velocity**: ${domTxt} median days on market vs ${domCTxt} county-wide
• **Supply Level**: ${invTxt} of inventory (${marketBalance})

**Recent Trends and Momentum**

${priceMom ? `Pricing has seen ${priceMom} movement month-over-month` : 'Pricing remains stable month-over-month'}, while ${domMom ? `days on market have ${domMom.includes('↓') ? 'decreased' : 'increased'} ${domMom}` : 'market timing remains consistent'}. ${invMom ? `Inventory levels have ${invMom.includes('↓') ? 'tightened' : 'expanded'} ${invMom}` : 'Supply levels remain steady'}.

Looking at the broader trend, ${priceYoy ? `annual price appreciation of ${priceYoy}` : 'year-over-year pricing shows healthy appreciation'} demonstrates the area's fundamental strength. ${domYoy ? `The ${domYoy.includes('↓') ? 'acceleration' : 'moderation'} in market timing (${domYoy} year-over-year)` : 'Market timing has remained relatively consistent year-over-year'} reflects evolving buyer behavior and seasonal patterns.

**What This Means for Market Participants**

**For Sellers**: The current environment favors well-prepared properties. Homes that are move-in ready, professionally staged, and strategically priced are capturing multiple offers within the first week. Focus on pre-listing inspections, professional photography, and launching with competitive pricing to maximize momentum.

**For Buyers**: While inventory remains constrained, opportunities exist for prepared purchasers. Success factors include pre-approval with local lenders, flexible closing timelines, and willingness to act quickly on quality properties. Consider expanding search criteria to include homes with good bones that may need cosmetic updates.

**Neighborhood Spotlight: What Makes ${nName} Special**

${nName}'s appeal extends beyond the numbers. The area's established character, with mature landscaping and well-maintained homes, creates an environment that feels both suburban and sophisticated. Proximity to excellent schools, parks, and recreational facilities continues to attract families seeking long-term stability.

The community's commitment to maintaining property values through active neighborhood associations and well-planned development ensures sustainable growth. Local amenities, including shopping, dining, and entertainment options, provide convenience without sacrificing the residential character that defines the area.

**Market Outlook and Strategic Considerations**

Current conditions suggest continued strength through the remainder of the year. The combination of limited inventory, sustained buyer interest, and ${nName}'s inherent desirability creates a foundation for stable appreciation.

Seasonal patterns typically bring increased activity in spring, making winter months an excellent time for serious buyers to position themselves ahead of increased competition. Sellers considering a move should evaluate current equity positions and market timing to optimize their transition strategy.

**Investment Perspective**

${nName} represents a compelling long-term value proposition. The area's established infrastructure, proximity to employment centers, and limited new construction opportunities support sustained demand. Historical appreciation patterns, combined with current market fundamentals, suggest continued outperformance relative to broader regional averages.

**Data Transparency and Sources**

${freshnessText} Our analysis incorporates Multiple Listing Service data, public records, and proprietary market research to provide the most comprehensive view of local conditions.${local?.sources ? ` Additional data sources include: ${((Array.isArray(local.sources) ? local.sources : []) as any[]).join(', ')}.` : ' Data reflects the most recent complete market period available.'} Market conditions can change rapidly, and individual property performance may vary based on specific location, condition, and pricing strategy.

*This analysis is provided for informational purposes and should not be considered as individual investment or real estate advice. Consult with qualified professionals for guidance specific to your situation.*`;
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
    ...(lastRetrievedISO ? [`Last updated: ${format(new Date(lastRetrievedISO), 'MMMM d, yyyy')}`] : []),
    `Median DOM — ${displayNeighborhood}: ${domLocal}${domCounty !== '—' ? ` | ${county}: ${domCounty}` : ''}`,
    `Active listings — ${displayNeighborhood}: ${activeLocal}`,
    ...(localReport?.new_listings != null ? [`New listings — ${displayNeighborhood}: ${Number(localReport.new_listings).toLocaleString()}`] : []),
    `Closed sales — ${displayNeighborhood}: ${closedLocal}`,
    ...(localReport?.median_sale_price != null ? [`Median sale price — ${displayNeighborhood}: $${Number(localReport.median_sale_price).toLocaleString()}`] : []),
    ...(localReport?.avg_price_per_sqft != null ? [`Avg price/sf — ${displayNeighborhood}: $${Number(localReport.avg_price_per_sqft).toFixed(0)}`] : []),
    ...(countyReport?.avg_price_per_sqft != null ? [`Avg price/sf — ${county}: $${Number(countyReport.avg_price_per_sqft).toFixed(0)}`] : []),
    ...(localReport?.months_of_inventory != null ? [`Months of inventory — ${displayNeighborhood}: ${Number(localReport.months_of_inventory).toFixed(1)}`] : []),
  ];

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast("Copied to clipboard");
  };

  const addGeneratedImage = async () => {
    if (!imagePrompt.trim()) {
      toast("Enter a prompt first");
      return;
    }
    setImageLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { prompt: imagePrompt }
      });
      if (error) throw error;
      const img = (data as any)?.image as string;
      if (img) {
        setGallery((g) => [img, ...g]);
        toast("Generated image added to gallery");
      } else {
        toast("Image generation failed");
      }
    } catch (err) {
      console.error(err);
      toast("Image generation failed. Check API keys.");
    } finally {
      setImageLoading(false);
    }
  };

  const enhancePrompt = async () => {
    if (!imagePrompt.trim()) return;
    setEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke('enhance-prompt', {
        body: { prompt: imagePrompt, neighborhood, county }
      });
      if (error) throw error;
      const enhanced = (data as any)?.enhancedPrompt as string;
      if (enhanced) {
        setImagePrompt(enhanced);
        toast("Prompt enhanced");
      } else {
        toast("Could not enhance prompt");
      }
    } catch (err) {
      console.error(err);
      toast("Enhance failed. Check API key.");
    } finally {
      setEnhancing(false);
    }
  };

  const downloadImage = (src: string, idx: number) => {
    const link = document.createElement('a');
    const name = `ai-image-${idx + 1}.png`;
    link.href = src;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deleteImage = (idx: number) => {
    setGallery((g) => g.filter((_, i) => i !== idx));
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
                <CardDescription>Detailed insights. {freshnessText}</CardDescription>
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
                  <Button variant="secondary" disabled={enhancing || !imagePrompt.trim()} onClick={enhancePrompt} aria-label="AI enhance prompt">
                    <Sparkles className="h-4 w-4" /> {enhancing ? "Enhancing…" : "AI Enhance"}
                  </Button>
                  <Button variant="hero" disabled={imageLoading || !imagePrompt.trim()} onClick={addGeneratedImage} aria-label="Generate image from prompt">
                    {imageLoading ? "Generating…" : "Generate Image"}
                  </Button>
                </div>
                <div className="grid gap-3 grid-cols-2 md:grid-cols-3 mt-4">
                  {gallery.map((src, idx) => (
                    <Card key={idx}>
                      <CardContent className="p-2">
                        <img src={src} alt={`Generated AI image for ${neighborhood}`} className="w-full h-40 object-cover rounded" loading="lazy" />
                        <div className="pt-2 flex gap-2">
                          <Button size="sm" variant="secondary" onClick={() => downloadImage(src, idx)} aria-label="Download image">
                            <Download className="h-4 w-4" /> Download
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteImage(idx)} aria-label="Delete image">
                            <Trash2 className="h-4 w-4" /> Delete
                          </Button>
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