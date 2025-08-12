import { Helmet } from "react-helmet-async";
import AppHeader from "@/components/layout/AppHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

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

  const titleDate = "August 10, 2025";
  const titleText = `${neighborhood} Pulse: ${titleDate}`;

  const blogBody = `**The ${neighborhood} Real Estate Story This Month**

${neighborhood} is having a moment. As I walked through the tree-lined streets this past week, talking with neighbors and touring new listings, one thing became crystal clear: this community is attracting serious attention from both buyers and sellers who understand quality when they see it.

**What's Driving Buyer Interest in ${neighborhood}**

Three factors are converging to make ${neighborhood} particularly attractive right now. First, the lifestyle amenities that locals have enjoyed for years—from the scenic trails along the American River to the weekend farmers market that consistently draws families from across ${county}—are finally getting the recognition they deserve. Second, the housing stock here offers something increasingly rare: character homes with good bones at price points that still make sense. Finally, ${neighborhood}'s location provides the perfect balance of suburban tranquility and urban accessibility.

**This Week's Market Highlights**

Let me share what caught my attention this week. On Fair Oaks Boulevard, a completely remodeled 1960s ranch drew eleven showings in its first weekend and closed $25,000 over asking price. The buyers? A young family relocating from San Francisco who told me they fell in love with the "small-town feel with big-city conveniences." 

Meanwhile, a mid-century modern on Kenneth Avenue that had been sitting stagnant for 45 days finally moved after the sellers took my advice to stage the living areas and highlight the home's architectural details. Sometimes it's not about price—it's about helping buyers envision their lives in the space.

**The Broader ${county} Context**

While ${neighborhood} continues to outperform, it's worth understanding how we fit into the larger ${county} market picture. County-wide, inventory levels have stabilized at around 1.2 months of supply—still technically a seller's market, but with more breathing room than we've seen in two years. 

What's interesting is the migration pattern we're seeing within ${county}. Buyers are increasingly willing to drive an extra 10-15 minutes for neighborhoods like ${neighborhood} that offer genuine community character. This trend is putting upward pressure on our local prices while creating opportunities for sellers who've been waiting for the right moment to make their move.

**Looking Ahead: What Buyers Want Right Now**

Based on the past 30 days of showings and conversations, today's buyers in ${neighborhood} are prioritizing three things: energy efficiency, outdoor living spaces, and move-in readiness. The homes that are moving quickly have updated HVAC systems, solar panels, or at minimum, modern windows and insulation. Buyers want to know their utility bills won't shock them.

Outdoor space has become non-negotiable. Whether it's a deck, patio, or just a well-maintained backyard, buyers want to feel connected to nature—something ${neighborhood} delivers naturally with our mature trees and proximity to parkland.

**The Numbers That Matter**

Here's what the data tells us: median days on market in ${neighborhood} currently sits at 12 days, compared to 18 days across ${county}. Average price per square foot has increased 4.2% year-over-year, while ${county} overall has seen 2.8% growth. We're outpacing the broader market, but not in a way that suggests unsustainable speculation.

**Why Now Might Be Your Moment**

If you've been thinking about selling, current conditions favor motivated sellers. Inventory remains low, buyer interest is high, and mortgage rates have found a stable range that allows qualified buyers to move forward with confidence.

For buyers, ${neighborhood} represents something increasingly rare in ${county}: a community where you can still find character, value, and genuine neighborhood feeling. The homes selling above asking price aren't doing so because of artificial scarcity—they're doing so because buyers recognize authentic value when they see it.

**Final Thoughts**

Real estate markets can feel abstract until you're walking through them daily like I do. What I see in ${neighborhood} right now isn't just market activity—it's families finding homes, neighbors welcoming newcomers, and a community continuing to evolve while maintaining its essential character. That's the kind of market foundation that creates lasting value, not just short-term gains.`;

  const socialPosts = [
    `Just dropped your ${neighborhood} Pulse with ${county} context: fresh listings, trends, and what buyers want this week.`,
    `${neighborhood} lifestyle in 15 seconds—parks, coffee, community vibes—with ${county} market context.`,
    `Market snapshot: ${neighborhood} DOM vs ${county} median—DM for specifics.`,
    `Multiple offers in ${neighborhood}, steady pricing across ${county}. Thinking of selling?`,
    `Your next home could be closer than you think. ${neighborhood} highlights + ${county} benchmarks inside.`,
  ];

  const marketDataPoints = [
    `New business opening in ${neighborhood}: locally-owned cafe draws weekend lines.`,
    `Community event in ${neighborhood}: farmers market saw record turnout.`,
    `Median DOM — ${neighborhood}: 12; ${county}: 18 (trend: improving locally).`,
    `Active listings — ${neighborhood}: 42; ${county}: 1,350 (stable week over week).`,
    `Closed sales — ${neighborhood}: 13 (3 above-ask); ${county}: 420 (mixed).`,
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
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{titleText}</h1>
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
                <CardDescription>Detailed market insights and storytelling</CardDescription>
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