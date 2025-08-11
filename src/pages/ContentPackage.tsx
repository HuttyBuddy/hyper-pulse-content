import { Helmet } from "react-helmet-async";
import AppHeader from "@/components/layout/AppHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { useState } from "react";
import { Link } from "react-router-dom";

import home1 from "@/assets/carmichael-home-1.jpg";
import home2 from "@/assets/carmichael-home-2.jpg";
import home3 from "@/assets/carmichael-home-3.jpg";
import lifestyleThumb from "@/assets/carmichael-lifestyle-thumb.jpg";
import marketThumb from "@/assets/market-update-thumb.jpg";

const blogTitle = "Carmichael Pulse: August 10, 2025";
const blogBody = `Carmichael continues to shine this month with steady buyer interest and well-priced listings moving quickly. Local favorites like the Jensen Botanical Garden and the American River Parkway keep lifestyle appeal strong. Median days on market remain competitive, and price reductions are modest compared to nearby zip codes.

In this week’s highlights, three newly remodeled ranch-style homes drew multiple offers within 7 days, while two premium properties with outdoor living spaces captured above-ask results. With mortgage rates stabilizing, seller confidence remains healthy and buyers are prioritizing move-in ready, energy-efficient upgrades.`;

const socialPosts = [
  "Just dropped your Carmichael Pulse: quick insights, fresh listings, and what buyers want this week.",
  "Carmichael lifestyle in 15 seconds: parks, coffee, and community vibes. Video inside!",
  "Market snapshot: Days on market down, demand for updated kitchens up. DM for details.",
  "3 remodels, 2 above-ask closings—Carmichael stays hot. Thinking of selling?",
  "Your next home could be closer than you think. Carmichael’s best kept streets are calling.",
];

const marketDataPoints = [
  "New business: 'The Daily Grind Coffee' opened on Fair Oaks Blvd.",
  "Community event: Saturday Farmers Market saw record turnout.",
  "Median DOM: 12 (down 2 weeks over week).",
  "Active listings: 42 (steady week over week).",
  "Closed sales: 13 (3 above-ask).",
];

const ContentPackage = () => {
  const [tab, setTab] = useState("blog");
  const [imagePrompt, setImagePrompt] = useState("");
  const [videoPrompt, setVideoPrompt] = useState("");
  const [gallery, setGallery] = useState<string[]>([home1, home2, home3]);
  const [videoThumbs] = useState<string[]>([lifestyleThumb, marketThumb]);

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast("Copied to clipboard");
  };

  const addGeneratedImage = () => {
    if (!imagePrompt.trim()) {
      toast("Enter a prompt first");
      return;
    }
    // Demo: append one of the existing images
    const next = [home1, home2, home3][Math.floor(Math.random() * 3)];
    setGallery((g) => [next, ...g]);
    toast("Generated image added to gallery");
  };

  const suggestImgPrompts = [
    "A beautiful, modern suburban home in Carmichael on a sunny day.",
    "Twilight exterior shot of a renovated ranch-style home in Carmichael.",
    "Bright kitchen interior with natural light and clean finishes in Carmichael.",
  ];

  const suggestVideoPrompts = [
    "Create a 15-second video montage of the Carmichael lifestyle: parks, local shops, friendly neighborhoods.",
    "Generate a 30-second market update video with text overlays.",
  ];

  return (
    <>
      <Helmet>
        <title>Content Package — Carmichael Pulse</title>
        <meta name="description" content="Access your blog, social posts, AI images, and market data in one place." />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : '/content'} />
      </Helmet>
      <AppHeader />
      <main className="container py-8">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Carmichael Pulse: August 10, 2025</h1>
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
                <CardTitle>{blogTitle}</CardTitle>
                <CardDescription>Formatted preview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-left">
                <h2 className="text-xl font-semibold">August Highlights</h2>
                <p className="text-muted-foreground leading-relaxed">{blogBody.split("\n\n")[0]}</p>
                <p className="text-muted-foreground leading-relaxed">{blogBody.split("\n\n")[1]}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button variant="secondary" onClick={() => copy(`${blogTitle}\n\n${blogBody}`)}>Copy Full Text</Button>
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
                      <img src={[home1, home2, home3][i % 3]} alt="Carmichael real estate post image" className="h-full w-full object-cover" loading="lazy" />
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
                        <img src={src} alt="Generated AI image for Carmichael" className="w-full h-40 object-cover rounded" loading="lazy" />
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
                        <img src={src} alt="Generated AI video thumbnail for Carmichael" className="w-full h-40 object-cover rounded" loading="lazy" />
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
