import { Helmet } from "react-helmet-async";
import AppHeader from "@/components/layout/AppHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { useState, useEffect, useCallback } from "react";
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
  const [gallery, setGallery] = useState<string[]>([home1, home2, home3]);
  const [imageLoading, setImageLoading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  
  // Veo 3 Video Planning State
  const [videoDuration, setVideoDuration] = useState(45);
  const [videoType, setVideoType] = useState("market_update");
  const [generatedVideoPlan, setGeneratedVideoPlan] = useState<any>(null);
  const [videoLoading, setVideoLoading] = useState(false);

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

  const resolvedDate = (localReport?.report_date as any) ?? (countyReport?.report_date as any) ?? (reportDate ? reportDate.toISOString().slice(0,10) : undefined);
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

  const generateVeo3Prompts = useCallback(async () => {
    setVideoLoading(true);
    try {
      const marketData = {
        neighborhood: displayNeighborhood,
        county,
        medianSalePrice: localReport?.median_sale_price,
        avgPricePSF: localReport?.avg_price_per_sqft,
        daysOnMarket: localReport?.days_on_market,
        activeListings: localReport?.active_listings,
        newListings: localReport?.new_listings,
        closedSales: localReport?.closed_sales,
        monthsInventory: localReport?.months_of_inventory,
        countyAvgPSF: countyReport?.avg_price_per_sqft,
        countyDOM: countyReport?.days_on_market,
        reportDate: resolvedDate,
      };

      const { data, error } = await supabase.functions.invoke('generate-veo3-prompts', {
        body: { 
          marketData, 
          neighborhood: displayNeighborhood, 
          county,
          videoDuration,
          videoType
        }
      });

      if (error) throw error;

      if (data?.success) {
        setGeneratedVideoPlan(data.videoPlan);
        toast("Veo 3 video plan generated successfully!");
      } else {
        throw new Error(data?.error || 'Failed to generate video plan');
      }
    } catch (err) {
      console.error('Video plan generation error:', err);
      toast("Failed to generate video plan. Check console for details.");
    } finally {
      setVideoLoading(false);
    }
  }, [displayNeighborhood, county, localReport, countyReport, resolvedDate, videoDuration, videoType]);

  const copyVideoPlan = async () => {
    if (!generatedVideoPlan) return;
    await navigator.clipboard.writeText(JSON.stringify(generatedVideoPlan, null, 2));
    toast("Video plan JSON copied to clipboard");
  };

  const downloadVideoPlan = () => {
    if (!generatedVideoPlan) return;
    const dataStr = JSON.stringify(generatedVideoPlan, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `veo3-video-plan-${displayNeighborhood.toLowerCase().replace(/\s+/g, '-')}-${new Date().getTime()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="blog">Newsletter / Blog</TabsTrigger>
            <TabsTrigger value="social">Social Media Posts</TabsTrigger>
            <TabsTrigger value="veo3">Veo 3 Video Planner</TabsTrigger>
            <TabsTrigger value="data">Market Data</TabsTrigger>
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
                      <Button size="sm" variant="outline" onClick={() => setTab("veo3")}>Create Video</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

        <TabsContent value="veo3" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Veo 3 Video Planner
              </CardTitle>
              <CardDescription>
                Generate structured JSON prompts for Veo 3 to create market update videos. Each prompt creates 8-second segments that can be stitched together.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Video Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Video Duration</label>
                   <select 
                     value={videoDuration} 
                     onChange={(e) => setVideoDuration(Number(e.target.value))}
                     className="w-full p-2 border rounded-md text-foreground"
                   >
                    <option value={30}>30 seconds (3-4 segments)</option>
                    <option value={45}>45 seconds (5 segments)</option>
                    <option value={60}>60 seconds (6-7 segments)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Video Type</label>
                   <select 
                     value={videoType} 
                     onChange={(e) => setVideoType(e.target.value)}
                     className="w-full p-2 border rounded-md text-foreground"
                   >
                    <option value="market_update">Market Update</option>
                    <option value="neighborhood_spotlight">Neighborhood Spotlight</option>
                    <option value="lifestyle_feature">Lifestyle Feature</option>
                  </select>
                </div>
              </div>

              {/* Generate Button */}
              <Button 
                onClick={generateVeo3Prompts} 
                disabled={videoLoading}
                className="w-full"
                size="lg"
              >
                {videoLoading ? "Generating Video Plan..." : "Generate Veo 3 Video Plan"}
              </Button>

              {/* Generated Video Plan Display */}
              {generatedVideoPlan && (
                <Card className="border-2 border-primary/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Generated Video Plan</CardTitle>
                      <div className="flex gap-2">
                        <Button onClick={copyVideoPlan} variant="outline" size="sm">
                          Copy JSON
                        </Button>
                        <Button onClick={downloadVideoPlan} variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      {generatedVideoPlan.segments?.length || 0} segments • {generatedVideoPlan.total_duration}s total duration
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Video Timeline */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Video Timeline</h4>
                      <div className="space-y-2">
                        {generatedVideoPlan.segments?.map((segment: any, idx: number) => (
                          <div key={idx} className="border rounded-lg p-3 bg-muted/50">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">
                                Segment {segment.segment} ({segment.duration}s)
                              </span>
                              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                {segment.scene_type}
                              </span>
                            </div>
                            <div className="space-y-1 text-sm">
                              <p><strong>Visual:</strong> {segment.prompt}</p>
                              <p><strong>Text Overlay:</strong> {segment.text_overlay}</p>
                              <p><strong>Camera:</strong> {segment.camera_movement}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* JSON Output */}
                    <div className="space-y-2">
                      <h4 className="font-medium">JSON for Veo 3 API</h4>
                      <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-64 border">
                        {JSON.stringify(generatedVideoPlan, null, 2)}
                      </pre>
                    </div>

                    {/* Style Notes */}
                    {generatedVideoPlan.style_notes && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Style Guidelines</h4>
                        <p className="text-sm text-muted-foreground">{generatedVideoPlan.style_notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Usage Instructions */}
              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-base">How to Use with Veo 3</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p>1. Generate your video plan using the button above</p>
                  <p>2. Copy or download the JSON containing all segment prompts</p>
                  <p>3. Use each segment prompt individually in Veo 3 to generate 8-second clips</p>
                  <p>4. Stitch the generated clips together using video editing software</p>
                  <p>5. Add transitions between segments as suggested in the plan</p>
                </CardContent>
              </Card>

              {/* Generated Images Gallery for Video */}
              <Card>
                <CardHeader>
                  <CardTitle>Reference Images</CardTitle>
                  <CardDescription>
                    Images that can be used as visual references for video segments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {gallery.map((src, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={src}
                          alt={`Reference ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-md"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => downloadImage(src, idx)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteImage(idx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

          <TabsContent value="data">
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