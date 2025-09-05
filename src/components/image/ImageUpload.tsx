import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, Zap, Camera, Home, Building2, Plane } from "lucide-react";
import { useImageEnhancement } from "@/hooks/use-image-enhancement";
import { toast } from "sonner";
import { ImageEnhancement } from "./ImageEnhancement";
import { REAL_ESTATE_CATEGORIES, REAL_ESTATE_PRESETS, type RealEstateCategoryKey } from "./RealEstateCategories";

interface UploadedImage {
  file: File;
  preview: string;
  id: string;
  category?: RealEstateCategoryKey;
}

export const ImageUpload = () => {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(null);
  const { uploadImage, enhanceImage, loading } = useImageEnhancement();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9)
    }));
    
    setUploadedImages(prev => [...prev, ...newImages]);
    toast.success(`Uploaded ${acceptedFiles.length} image${acceptedFiles.length > 1 ? 's' : ''}`);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: true
  });

  const removeImage = (id: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id));
    if (selectedImage?.id === id) {
      setSelectedImage(null);
    }
  };

  const handleQuickEnhance = async (image: UploadedImage, preset: string) => {
    try {
      const result = await uploadImage(image.file, image.category);
      if (result) {
        await enhanceImage(result.id, preset);
        toast.success(`Enhanced with ${preset} preset!`);
        removeImage(image.id);
      }
    } catch (error) {
      toast.error("Failed to enhance image");
    }
  };

  const updateImageCategory = (imageId: string, category: RealEstateCategoryKey) => {
    setUploadedImages(prev => 
      prev.map(img => img.id === imageId ? { ...img, category } : img)
    );
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        {isDragActive ? (
          <p className="text-lg">Drop the images here...</p>
        ) : (
          <>
            <Camera className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-lg mb-2">Drop real estate photos here</p>
            <p className="text-sm text-muted-foreground">or click to browse files</p>
            <p className="text-xs text-muted-foreground mt-2">Supports: JPG, PNG, WebP • Interior, Exterior, Aerial, Detail shots</p>
          </>
        )}
      </div>

      {/* Uploaded Images Grid */}
      {uploadedImages.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Ready to Enhance ({uploadedImages.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploadedImages.map((image) => (
              <Card key={image.id} className="overflow-hidden">
                <div className="aspect-square relative">
                  <img
                    src={image.preview}
                    alt="Uploaded preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => removeImage(image.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <p className="text-sm font-medium truncate">{image.file.name}</p>
                    
                    <Select value={image.category} onValueChange={(value: RealEstateCategoryKey) => updateImageCategory(image.id, value)}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(REAL_ESTATE_CATEGORIES).map(([key, category]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              {key === 'interior' && <Home className="h-3 w-3" />}
                              {key === 'exterior' && <Building2 className="h-3 w-3" />}
                              {key === 'aerial' && <Plane className="h-3 w-3" />}
                              {key === 'commercial' && <Building2 className="h-3 w-3" />}
                              <span>{category.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">
                        {(image.file.size / 1024 / 1024).toFixed(1)}MB
                      </Badge>
                      {image.category && (
                        <Badge variant="secondary" className="text-xs">
                          {REAL_ESTATE_CATEGORIES[image.category].label}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedImage(image)}
                        className="flex-1"
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Custom Enhance
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleQuickEnhance(image, image.category === 'interior' ? "HDR Interior" : "Curb Appeal")}
                        disabled={loading || !image.category}
                        className="flex-1"
                      >
                        Quick Enhance
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Enhancement Interface */}
      {selectedImage && (
        <ImageEnhancement 
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onComplete={() => {
            removeImage(selectedImage.id);
            setSelectedImage(null);
          }}
        />
      )}
    </div>
  );
};