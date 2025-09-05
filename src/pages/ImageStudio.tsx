import { Helmet } from "react-helmet-async";
import AppHeader from "@/components/layout/AppHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
          <h1 className="text-3xl font-semibold tracking-tight mb-2">Real Estate Image Studio</h1>
          <p className="text-muted-foreground">Professional image processing for real estate photography. Upload, enhance, and optimize property photos for marketing materials.</p>
        </section>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload & Process
            </TabsTrigger>
            <TabsTrigger value="batch" className="flex items-center gap-2">
              <Images className="h-4 w-4" />
              Batch Processing
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <Images className="h-4 w-4" />
              Image Library
            </TabsTrigger>
            <TabsTrigger value="presets" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Real Estate Presets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>Upload & Process Real Estate Images</CardTitle>
                <CardDescription>
                  Upload property photos and apply professional real estate enhancements. Supports interior, exterior, aerial, and detail shots.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUpload />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="batch">
            <Card>
              <CardHeader>
                <CardTitle>Batch Processing</CardTitle>
                <CardDescription>
                  Upload multiple property photos at once and apply consistent enhancements across an entire listing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Upload className="h-12 w-12 mx-auto mb-4" />
                  <p>Batch processing feature coming soon!</p>
                  <p className="text-sm mt-2">Upload multiple images and apply presets to entire property sets.</p>
                </div>
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

          <TabsContent value="presets">
            <Card>
              <CardHeader>
                <CardTitle>Real Estate Enhancement Presets</CardTitle>
                <CardDescription>
                  Professional presets optimized for different types of real estate photography.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: "HDR Interior", description: "Balanced lighting for indoor spaces with natural window light", category: "Interior" },
                    { name: "Bright & Airy", description: "Modern real estate style with lifted shadows and crisp whites", category: "Interior" },
                    { name: "Warm Twilight", description: "Evening exterior shots with enhanced warm lighting", category: "Exterior" },
                    { name: "Curb Appeal", description: "Exterior enhancement with vivid landscaping and sky", category: "Exterior" },
                    { name: "Luxury Interior", description: "Rich, sophisticated enhancement for high-end properties", category: "Interior" },
                    { name: "Commercial Property", description: "Clean, professional look for business spaces", category: "Commercial" },
                    { name: "Vacation Rental", description: "Inviting, lifestyle-oriented enhancement", category: "Interior" },
                    { name: "New Construction", description: "Clean, modern enhancement highlighting fresh finishes", category: "Interior" },
                    { name: "Aerial Showcase", description: "Enhanced contrast and clarity for drone photography", category: "Aerial" },
                    { name: "Detail Shots", description: "Sharp, focused enhancement for architectural features", category: "Detail" },
                    { name: "Kitchen Spotlight", description: "Optimized for kitchen photography with warm tones", category: "Interior" },
                    { name: "Bathroom Clarity", description: "Clean, bright enhancement for bathroom spaces", category: "Interior" },
                  ].map((preset) => (
                    <Card key={preset.name} className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-sm">{preset.name}</CardTitle>
                            <CardDescription className="text-xs mt-1">{preset.description}</CardDescription>
                          </div>
                          <Badge variant="outline" className="text-xs">{preset.category}</Badge>
                        </div>
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