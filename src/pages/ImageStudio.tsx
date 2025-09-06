import { Helmet } from "react-helmet-async";
import AppHeader from "@/components/layout/AppHeader";
import { EnhancedTabs, TabsContent } from "@/components/ui/enhanced-tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/image/ImageUpload";
import { ImageLibrary } from "@/components/image/ImageLibrary";
import { Upload, Palette, Images, Layers } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const ImageStudio = () => {
  const isMobile = useIsMobile();

  return (
    <>
      <Helmet>
        <title>Image Studio — The Hyper-Local Pulse</title>
        <meta name="description" content="Upload, enhance, and manage lifestyle images for your real estate content." />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : '/image-studio'} />
      </Helmet>
      
      <AppHeader />
      
      <main className="container px-3 md:px-4 py-4 md:py-8">
        <section className="mb-4 md:mb-8">
          <h1 className="text-xl md:text-3xl font-semibold tracking-tight mb-2 truncate">Real Estate Image Studio</h1>
          <p className="text-muted-foreground text-sm md:text-base">Professional image processing for real estate photography. Upload, enhance, and optimize property photos for marketing materials.</p>
        </section>

        <EnhancedTabs 
          defaultValue="upload" 
          className="space-y-4 md:space-y-6"
          tabs={[
            { 
              value: "upload", 
              label: "Upload", 
              icon: Upload,
              badge: "New"
            },
            { 
              value: "batch", 
              label: "Batch", 
              icon: Layers,
              badge: "Soon"
            },
            { 
              value: "library", 
              label: "Library", 
              icon: Images
            },
            { 
              value: "presets", 
              label: "Presets", 
              icon: Palette,
              badge: "12"
            }
          ]}
        >

          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Upload & Process Real Estate Images</CardTitle>
                <CardDescription className="text-sm md:text-base">
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
                <CardTitle className="text-lg md:text-xl">Batch Processing</CardTitle>
                <CardDescription className="text-sm md:text-base">
                  Upload multiple property photos at once and apply consistent enhancements across an entire listing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6 md:py-8 text-muted-foreground">
                  <Upload className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4" />
                  <p className="text-sm md:text-base">Batch processing feature coming soon!</p>
                  <p className="text-xs md:text-sm mt-2">Upload multiple images and apply presets to entire property sets.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="library">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Your Image Library</CardTitle>
                <CardDescription className="text-sm md:text-base">
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
                <CardTitle className="text-lg md:text-xl">Real Estate Enhancement Presets</CardTitle>
                <CardDescription className="text-sm md:text-base">
                  Professional presets optimized for different types of real estate photography.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
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
                      <CardHeader className="p-3 md:p-6">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-sm md:text-base truncate">{preset.name}</CardTitle>
                            <CardDescription className="text-xs md:text-sm mt-1 line-clamp-2">{preset.description}</CardDescription>
                          </div>
                          <Badge variant="outline" className="text-xs flex-shrink-0">{preset.category}</Badge>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </EnhancedTabs>
      </main>
    </>
  );
};

export default ImageStudio;