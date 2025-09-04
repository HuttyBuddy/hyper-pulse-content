import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Download, 
  Trash2, 
  MoreHorizontal, 
  Copy,
  ExternalLink,
  Filter,
  Grid3X3,
  List
} from "lucide-react";
import { useImageEnhancement } from "@/hooks/use-image-enhancement";
import { format } from "date-fns";
import { toast } from "sonner";

interface EnhancedImage {
  id: string;
  original_filename: string;
  original_url: string;
  enhanced_url: string | null;
  enhancement_preset: string | null;
  tags: string[] | null;
  category: string;
  file_size: number | null;
  dimensions: any;
  created_at: string;
}

export const ImageLibrary = () => {
  const [images, setImages] = useState<EnhancedImage[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  
  const { getUserImages, deleteImage } = useImageEnhancement();

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      setLoading(true);
      const userImages = await getUserImages();
      setImages(userImages);
    } catch (error) {
      toast.error("Failed to load images");
    } finally {
      setLoading(false);
    }
  };

  const filteredImages = images.filter(image => {
    const matchesSearch = image.original_filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (image.tags && image.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    
    const matchesCategory = selectedCategory === "all" || image.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(images.map(img => img.category))];

  const handleDownload = (image: EnhancedImage) => {
    const link = document.createElement('a');
    link.href = image.enhanced_url || image.original_url;
    link.download = image.original_filename;
    link.target = '_blank';
    link.click();
  };

  const handleCopyUrl = (image: EnhancedImage) => {
    navigator.clipboard.writeText(image.enhanced_url || image.original_url);
    toast.success("Image URL copied to clipboard");
  };

  const handleDelete = async (image: EnhancedImage) => {
    if (window.confirm("Are you sure you want to delete this image?")) {
      try {
        await deleteImage(image.id);
        setImages(prev => prev.filter(img => img.id !== image.id));
        toast.success("Image deleted successfully");
      } catch (error) {
        toast.error("Failed to delete image");
      }
    }
  };

  const handleUseInContent = (image: EnhancedImage) => {
    // This would integrate with the content creation workflow
    toast.success("Added image to content clipboard");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-1" />
                Category
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSelectedCategory("all")}>
                All Categories
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {categories.map((category) => (
                <DropdownMenuItem key={category} onClick={() => setSelectedCategory(category)}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          >
            {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        <Badge variant="outline">{filteredImages.length} images</Badge>
        {selectedCategory !== "all" && (
          <Badge variant="secondary">{selectedCategory}</Badge>
        )}
      </div>

      {/* Images */}
      {filteredImages.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No images found. Upload some images to get started!</p>
        </div>
      ) : (
        <div className={
          viewMode === "grid" 
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            : "space-y-4"
        }>
          {filteredImages.map((image) => (
            viewMode === "grid" ? (
              <Card key={image.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square relative group">
                  <img
                    src={image.enhanced_url || image.original_url}
                    alt={image.original_filename}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="secondary">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleUseInContent(image)}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Use in Content
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload(image)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCopyUrl(image)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy URL
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDelete(image)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="text-sm font-medium truncate">{image.original_filename}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {image.category}
                    </Badge>
                    {image.enhancement_preset && (
                      <Badge variant="secondary" className="text-xs">
                        {image.enhancement_preset}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(image.created_at), 'MMM d, yyyy')}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card key={image.id} className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                    <img
                      src={image.enhanced_url || image.original_url}
                      alt={image.original_filename}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{image.original_filename}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {image.category}
                      </Badge>
                      {image.enhancement_preset && (
                        <Badge variant="secondary" className="text-xs">
                          {image.enhancement_preset}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(image.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleUseInContent(image)}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Use in Content
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(image)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCopyUrl(image)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy URL
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDelete(image)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            )
          ))}
        </div>
      )}
    </div>
  );
};