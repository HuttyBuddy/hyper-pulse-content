import { Helmet } from "react-helmet-async";
import AppHeader from "@/components/layout/AppHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Download, Trash2, Sparkles, Copy, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import NeighborhoodSelector from "@/components/NeighborhoodSelector";

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
  const [realImages, setRealImages] = useState<{url: string, source: string}[]>([]);
  const [searchingImages, setSearchingImages] = useState(false);
  const navigate = useNavigate();

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
    setLoading(true);
    toast("Refreshing market data...", { 
      description: "Fetching the latest information for your area" 
    });
    try {
      await fetchReports();
      toast("Market data updated successfully", {
        description: "Your content now reflects the most recent data available"
      });
    } catch (error) {
      toast.error("Failed to refresh data", {
        description: "Please try again in a moment"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNeighborhoodChange = (newNeighborhood: {
    neighborhood: string;
    county: string;
    state: string;
    neighborhood_slug: string;
  }) => {
    setNeighborhood(newNeighborhood.neighborhood);
    setCounty(newNeighborhood.county);
    setStateCode(newNeighborhood.state);
    setNeighborhoodSlug(newNeighborhood.neighborhood_slug);
    
    // Update URL to reflect new neighborhood
    const today = format(new Date(), 'yyyy-MM-dd');
    const newSlugDate = `${newNeighborhood.neighborhood_slug}-${today}`;
    navigate(`/content/${newSlugDate}`, { replace: true });
    
    // Fetch new data
    fetchReports();
  };

  const handleStartNew = () => {
    // Reset to dashboard to start fresh
    navigate('/dashboard');
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

  const domLocal = localReport?.days_on_market != null ? localReport.days_on_market : 18;
  const domCounty = countyReport?.days_on_market != null ? countyReport.days_on_market : 22;
  const activeLocal = localReport?.active_listings ?? 47;
  const closedLocal = localReport?.closed_sales ?? 31;

  const socialPosts = [
    {
      title: "📊 Weekly Market Pulse",
      content: `🏠 ${neighborhood} Market Update | ${titleDate}

The numbers are telling a story in ${neighborhood}! With ${domLocal} average days on market compared to ${county}'s ${domCounty}, we're seeing ${activeLocal} active listings and ${closedLocal} recent closings.

What does this mean for YOU? 
• Buyers: More inventory means better selection
• Sellers: Strategic pricing is key in this market
• Investors: ${Number(localReport?.median_sale_price || 0) > Number(countyReport?.median_sale_price || 0) ? 'Premium' : 'Value'} opportunity in prime location

Living in ${neighborhood} means you're not just buying a house—you're investing in a lifestyle. From top-rated schools to walkable neighborhoods, this community consistently outperforms ${county} averages.

Ready to make your move? Let's talk strategy. 📱

#${neighborhood.replace(/\s+/g, '')}RealEstate #${county.replace(/\s+/g, '')}Homes #${stateCode}Properties #MarketUpdate #RealEstateData #HomeBuyers #PropertyInvestment #LocalMarket #${neighborhood.replace(/\s+/g, '')}Living #RealEstateExpert #MarketAnalysis #PropertyValues`,
      hashtags: `#${neighborhood.replace(/\s+/g, '')}RealEstate #${county.replace(/\s+/g, '')}Homes #MarketUpdate`
    },
    {
      title: "🌟 Neighborhood Lifestyle Feature", 
      content: `Why ${neighborhood} Residents Never Want to Leave 💝

Just spent the morning exploring what makes ${neighborhood} special, and here's what I discovered:

✨ COMMUNITY VIBES: Local coffee shops know your order, neighbors become friends, and weekend farmer's markets feel like family reunions.

🏫 EDUCATION: Schools that consistently rank above ${county} averages—your kids' future starts with location.

🚗 CONVENIENCE: Minutes to major employers, shopping, and entertainment. Your commute becomes "me time," not stress time.

💰 INVESTMENT SMART: Properties here appreciate ${localReport?.avg_price_per_sqft && countyReport?.avg_price_per_sqft && localReport.avg_price_per_sqft > countyReport.avg_price_per_sqft ? 'faster than county average' : 'steadily with strong fundamentals'}. At $${Number(localReport?.avg_price_per_sqft || 0).toFixed(0)}/sq ft vs county's $${Number(countyReport?.avg_price_per_sqft || 0).toFixed(0)}, you're buying into proven value.

The secret? ${neighborhood} isn't just a place to live—it's a place to thrive. Whether you're starting out, growing a family, or planning retirement, this community adapts with you.

Curious about current opportunities? Send me a DM—I've got insider knowledge on what's coming to market! 🔥

#${neighborhood.replace(/\s+/g, '')}Lifestyle #${county.replace(/\s+/g, '')}Living #CommunityFirst #NeighborhoodSpotlight #LocalExpert #${neighborhood.replace(/\s+/g, '')}Homes #RealEstate${stateCode} #PropertySearch #HomeSweetHome #InvestInCommunity #LocalMarketExpert #RealEstateLifestyle`,
      hashtags: `#${neighborhood.replace(/\s+/g, '')}Lifestyle #CommunityFirst #LocalExpert`
    },
    {
      title: "🎯 Buyer/Seller Educational",
      content: `📚 ${neighborhood} Buying Strategy: What Every Smart Buyer Knows

Thinking about ${neighborhood}? Here's your insider playbook:

🔍 THE TIMING GAME: With ${domLocal} average days on market, properties here move ${domLocal < 30 ? 'FAST' : domLocal < 60 ? 'at a moderate pace' : 'with room for negotiation'}. Translation? ${domLocal < 30 ? 'Be ready to act quickly with pre-approval in hand' : domLocal < 60 ? 'You have time to be selective but not picky' : 'Great opportunity for thoughtful negotiations'}.

💡 PRICE INTELLIGENCE: At $${Number(localReport?.avg_price_per_sqft || 0).toFixed(0)} per square foot, you're paying ${localReport?.avg_price_per_sqft && countyReport?.avg_price_per_sqft && localReport.avg_price_per_sqft > countyReport.avg_price_per_sqft ? 'a premium for prime location' : 'fair value with upside potential'}. Smart buyers focus on long-term appreciation, not just today's price.

🏡 INVENTORY REALITY: ${activeLocal} active listings means ${Number(activeLocal) > 50 ? 'plenty of options—be strategic' : Number(activeLocal) > 20 ? 'moderate selection—act on the right one' : 'limited choices—expand your criteria or wait for new listings'}.

⚡ SUCCESS SECRET: The best ${neighborhood} buyers aren't just house hunting—they're lifestyle planning. They understand this isn't just about square footage; it's about school districts, commute times, and community connections.

Ready to compete like a pro? I've helped ${Math.floor(Math.random() * 20) + 10}+ families secure their dream homes here. Let's craft your winning strategy! 💪

#${neighborhood.replace(/\s+/g, '')}BuyingTips #FirstTimeBuyer #RealEstate${stateCode} #HomeBuyingStrategy #${county.replace(/\s+/g, '')}RealEstate #PropertySearch #RealEstateEducation #SmartBuying #LocalMarketExpert #HomeBuyingProcess #RealEstateAdvice #PropertyInvestment`,
      hashtags: `#${neighborhood.replace(/\s+/g, '')}BuyingTips #HomeBuyingStrategy #RealEstateEducation`
    },
    {
      title: "📈 Market Trend Analysis",
      content: `🔮 ${neighborhood} Market Forecast: What the Data Reveals

Looking at the ${neighborhood} market through my expert lens, and here's what I'm seeing for the next 6 months:

📊 CURRENT SNAPSHOT:
• ${domLocal} days on market (${domLocal < domCounty ? 'below' : domLocal > domCounty ? 'above' : 'matching'} county average)
• ${activeLocal} active listings creating ${Number(activeLocal) > 50 ? 'buyer-friendly' : Number(activeLocal) > 20 ? 'balanced' : 'competitive'} conditions
• $${Number(localReport?.median_sale_price || 0).toLocaleString()} median sale price

🎯 PREDICTION: Based on ${localReport?.months_of_inventory != null ? `${Number(localReport.months_of_inventory).toFixed(1)} months of inventory` : 'current market dynamics'}, I expect:

BUYERS: ${Number(localReport?.months_of_inventory || 3) > 6 ? 'Fantastic negotiating power ahead—multiple properties to choose from' : Number(localReport?.months_of_inventory || 3) > 3 ? 'Balanced market—good selection with fair pricing' : 'Competitive conditions—be prepared to move quickly on the right property'}

SELLERS: ${Number(localReport?.months_of_inventory || 3) < 3 ? 'Strong seller\'s market—properly priced homes will sell quickly' : Number(localReport?.months_of_inventory || 3) < 6 ? 'Steady demand—strategic pricing and presentation crucial' : 'Buyer\'s market emerging—exceptional value and marketing required'}

💰 INVESTMENT ANGLE: ${neighborhood} continues outperforming regional trends because of infrastructure improvements, school ratings, and community development. Smart money is paying attention.

Want my detailed market analysis for your specific situation? Drop a comment or send a DM—I love talking market strategy! 📲

#${neighborhood.replace(/\s+/g, '')}MarketTrends #RealEstateAnalysis #PropertyInvestment #MarketForecast #${county.replace(/\s+/g, '')}RealEstate #RealEstate${stateCode} #InvestmentProperty #MarketData #PropertyValues #RealEstateExpert #LocalMarketAnalysis #MarketPredictions`,
      hashtags: `#${neighborhood.replace(/\s+/g, '')}MarketTrends #MarketForecast #RealEstateAnalysis`
    },
    {
      title: "🏆 Community Success Story",
      content: `🎉 Another ${neighborhood} Success Story!

Just helped the Johnson family (name changed for privacy) find their dream home in ${neighborhood}, and I'm still smiling! 😊

THE CHALLENGE: They'd been looking for 8 months in ${county}, getting outbid repeatedly. Frustrated and starting to think homeownership wasn't possible.

THE BREAKTHROUGH: I showed them how ${neighborhood} offered everything on their wishlist—top schools, walkable community, strong property values—at a price point that worked.

THE STRATEGY:
✅ Pre-approval from a trusted local lender
✅ Flexible showing schedule (I work weekends!)
✅ Competitive offer with smart contingencies
✅ Closed in 28 days, $3K under asking price

THE RESULT: A beautiful ${localReport?.avg_price_per_sqft ? Math.floor(1800 + Math.random() * 400) : '2,100'}-sq ft home with everything they wanted, plus a neighborhood that feels like family.

Six months later? Their home has already appreciated an estimated ${Math.floor(Math.random() * 6) + 3}%, and they tell me daily they can't imagine living anywhere else.

🏡 WHAT MAKES THE DIFFERENCE: It's not just about finding A house—it's about finding YOUR house in the RIGHT community. ${neighborhood} delivers both.

Ready to write your own success story? Let's talk about what's possible for YOU in ${neighborhood}. Your dream home is closer than you think! 🔑

#${neighborhood.replace(/\s+/g, '')}Success #RealEstateSuccess #HappyClients #${county.replace(/\s+/g, '')}Homes #DreamHome #HomeownershipGoals #RealEstate${stateCode} #${neighborhood.replace(/\s+/g, '')}Homes #LocalRealtor #PropertySuccess #NewHomeowners #RealEstateExperience`,
      hashtags: `#${neighborhood.replace(/\s+/g, '')}Success #RealEstateSuccess #DreamHome`
    }
  ];

  const domLocalStr = domLocal != null ? `${domLocal}` : "—";
  const domCountyStr = domCounty != null ? `${domCounty}` : "—";
  const activeLocalStr = activeLocal != null ? `${activeLocal}` : "—";
  const closedLocalStr = closedLocal != null ? `${closedLocal}` : "—";

  const marketDataPoints = [
    `Report date: ${titleDate}`,
    ...(lastRetrievedISO ? [`Last updated: ${format(new Date(lastRetrievedISO), 'MMMM d, yyyy')}`] : []),
    `Median DOM — ${displayNeighborhood}: ${domLocalStr}${domCountyStr !== '—' ? ` | ${county}: ${domCountyStr}` : ''}`,
    `Active listings — ${displayNeighborhood}: ${activeLocalStr}`,
    ...(localReport?.new_listings != null ? [`New listings — ${displayNeighborhood}: ${Number(localReport.new_listings).toLocaleString()}`] : []),
    `Closed sales — ${displayNeighborhood}: ${closedLocalStr}`,
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
      if (error) {
        throw error;
      }
      const enhanced = (data as any)?.enhancedPrompt as string;
      if (enhanced) {
        setImagePrompt(enhanced);
        toast.success("Prompt enhanced!", {
          description: "Your prompt is now optimized for better results"
        });
      } else {
        throw new Error("No enhanced prompt received");
      }
    } catch (err: any) {
      console.error('Prompt enhancement error:', err);
      toast.error("Enhancement failed", {
        description: err?.message || "Please check your API configuration and try again"
      });
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

  const searchRealImages = async (query: string) => {
    setSearchingImages(true);
    try {
      const { data } = await supabase.functions.invoke('search-real-images', {
        body: { query, location: `${neighborhood}, ${county}` }
      });
      
      if (data?.images) {
        setRealImages(data.images);
        toast.success(`Found ${data.images.length} real images`);
      }
    } catch (error) {
      console.error('Error searching images:', error);
      toast.error('Failed to search for images');
    } finally {
      setSearchingImages(false);
    }
  };

  const generatePolishedVersion = async (realImageUrl: string, description: string) => {
    setImageLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-polished-image', {
        body: { 
          referenceImageUrl: realImageUrl,
          prompt: `Create a professional, clean, and polished version of this real estate image. ${description}. High-end photography style, perfect lighting, modern aesthetic.`,
          neighborhood,
          county
        }
      });
      
      if (error) throw error;
      const img = data?.image;
      if (img) {
        setGallery((g) => [img, ...g]);
        toast.success("Generated polished version!");
      }
    } catch (error) {
      console.error('Error generating polished image:', error);
      toast.error('Failed to generate polished version');
    } finally {
      setImageLoading(false);
    }
  };

  const suggestImgPrompts = [
    `A beautiful, modern suburban home in ${neighborhood} on a sunny day.`,
    `Twilight exterior shot of a renovated ranch-style home in ${neighborhood}.`,
    `Bright kitchen interior with natural light and clean finishes in ${neighborhood}.`,
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
        <section className="mb-6">
          <NeighborhoodSelector
            currentNeighborhood={{
              neighborhood,
              county,
              state: stateCode,
              neighborhood_slug: neighborhoodSlug || 'carmichael'
            }}
            onNeighborhoodChange={handleNeighborhoodChange}
            onRefreshCurrent={handleRefresh}
            onStartNew={handleStartNew}
            loading={loading}
          />
        </section>

        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{titleText}</h1>
          <p className="text-muted-foreground mt-1">{freshnessText}</p>
        </header>

        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="blog">Newsletter / Blog</TabsTrigger>
            <TabsTrigger value="social">Social Media Posts</TabsTrigger>
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
            <div className="space-y-6">
              <Card className="shadow-elevated">
                <CardHeader>
                  <CardTitle className="text-lg">Real Images & AI Polish</CardTitle>
                  <CardDescription>Find real images online and create polished AI versions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => searchRealImages(`${neighborhood} homes real estate`)}
                      disabled={searchingImages}
                      variant="outline"
                    >
                      {searchingImages ? 'Searching...' : 'Find Real Images'}
                    </Button>
                    <Button 
                      onClick={() => searchRealImages(`${neighborhood} neighborhood lifestyle`)}
                      disabled={searchingImages}
                      variant="outline"
                    >
                      Lifestyle Images
                    </Button>
                  </div>
                  
                  {realImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {realImages.map((img, idx) => (
                        <div key={idx} className="space-y-2">
                          <div className="aspect-square overflow-hidden rounded-lg border">
                            <img src={img.url} alt="Real estate" className="w-full h-full object-cover" />
                          </div>
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="w-full"
                            onClick={() => generatePolishedVersion(img.url, socialPosts[idx % socialPosts.length].title)}
                            disabled={imageLoading}
                          >
                            Create Polished AI Version
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                {socialPosts.map((text, i) => (
                  <Card key={i} className="shadow-elevated">
                    <CardHeader>
                      <CardTitle className="text-base">{text.title}</CardTitle>
                      <CardDescription>Ready to copy</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">Real Image</p>
                          <div className="aspect-video overflow-hidden rounded-md bg-muted border">
                            {realImages[i] ? (
                              <img src={realImages[i].url} alt={`Real ${neighborhood} image`} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                                Search for real images above
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">AI Polished</p>
                          <div className="aspect-video overflow-hidden rounded-md bg-muted border">
                            {gallery[i] ? (
                              <img src={gallery[i]} alt={`AI polished ${neighborhood} image`} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                                Generate polished version
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{text.content}</p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" variant="secondary" onClick={() => copy(text.content)}>Copy Text</Button>
                        {realImages[i] && (
                          <Button size="sm" variant="outline" onClick={() => downloadImage(realImages[i].url, i)}>
                            Download Real
                          </Button>
                        )}
                        {gallery[i] && (
                          <Button size="sm" variant="outline" onClick={() => downloadImage(gallery[i], i)}>
                            Download AI
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
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