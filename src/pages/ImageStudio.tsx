import { Helmet } from "react-helmet-async";
import AppHeader from "@/components/layout/AppHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/image/ImageUpload";
import { ImageLibrary } from "@/components/image/ImageLibrary";
import { Upload, Palette, Images } from "lucide-react";

const ImageStudio = () => {
  return (
    <>
      <Helmet>
        <title>Image Studio — The Hyper-Local Pulse</title>
        <meta name="description" content="Upload, enhance, and manage lifestyle images for your real estate content." />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : '/image-studio'} />
      </Helmet>
      
      <AppHeader />
      
      <main className="container py-8">
        <section className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight mb-2">Image Studio</h1>
          <p className="text-muted-foreground">Upload and enhance lifestyle images for your content.</p>
        </section>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload & Enhance
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <Images className="h-4 w-4" />
              Image Library
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Enhancement Presets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>Upload & Enhance Images</CardTitle>
                <CardDescription>
                  Upload lifestyle photos and apply enhancement presets to make them shine.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUpload />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="library">
            <Card>
              <CardHeader>
                <CardTitle>Your Image Library</CardTitle>
                <CardDescription>
                  Browse and manage your uploaded and enhanced images.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageLibrary />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle>Enhancement Presets</CardTitle>
                <CardDescription>
                  Ready-to-use enhancement presets optimized for lifestyle photography.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: "Coffee Shop Cozy", description: "Warm, inviting atmosphere perfect for community spots" },
                    { name: "Family Friendly", description: "Bright, clean look ideal for family-oriented venues" },
                    { name: "Community Event", description: "Vibrant, energetic enhancement for event photos" },
                    { name: "Local Business", description: "Professional, welcoming look for business features" },
                    { name: "Outdoor Living", description: "Natural, fresh enhancement for outdoor spaces" },
                    { name: "Neighborhood Charm", description: "Authentic, lived-in feel for residential areas" },
                  ].map((preset) => (
                    <Card key={preset.name} className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
                      <CardHeader>
                        <CardTitle className="text-sm">{preset.name}</CardTitle>
                        <CardDescription className="text-xs">{preset.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
};

export default ImageStudio;