import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, Save, RotateCcw, Download, Zap } from "lucide-react";
import { useImageEnhancement } from "@/hooks/use-image-enhancement";
import { REAL_ESTATE_PRESETS, type RealEstatePresetKey } from "./RealEstateCategories";
import { toast } from "sonner";

interface ImageEnhancementProps {
  image: {
    file: File;
    preview: string;
    id: string;
  };
  onClose: () => void;
  onComplete: () => void;
}

interface EnhancementSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  temperature: number;
  crop: { x: number; y: number; width: number; height: number } | null;
}

// Using real estate presets from the imported constant

export const ImageEnhancement = ({ image, onClose, onComplete }: ImageEnhancementProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const [settings, setSettings] = useState<EnhancementSettings>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    temperature: 0,
    crop: null
  });
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const { uploadImage, enhanceImage, loading } = useImageEnhancement();

  useEffect(() => {
    const canvas = canvasRef.current;
    const originalCanvas = originalCanvasRef.current;
    if (!canvas || !originalCanvas) return;

    const ctx = canvas.getContext('2d');
    const originalCtx = originalCanvas.getContext('2d');
    if (!ctx || !originalCtx) return;

    const img = new Image();
    img.onload = () => {
      // Set canvas dimensions
      const maxSize = 800;
      const scale = Math.min(maxSize / img.width, maxSize / img.height);
      const width = img.width * scale;
      const height = img.height * scale;

      canvas.width = width;
      canvas.height = height;
      originalCanvas.width = width;
      originalCanvas.height = height;

      // Draw original image
      originalCtx.drawImage(img, 0, 0, width, height);
      
      // Apply enhancements to main canvas
      applyEnhancements(ctx, originalCtx, width, height);
    };
    img.src = image.preview;
  }, [image.preview]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const originalCanvas = originalCanvasRef.current;
    if (!canvas || !originalCanvas) return;

    const ctx = canvas.getContext('2d');
    const originalCtx = originalCanvas.getContext('2d');
    if (!ctx || !originalCtx) return;

    applyEnhancements(ctx, originalCtx, canvas.width, canvas.height);
  }, [settings]);

  const applyEnhancements = (ctx: CanvasRenderingContext2D, originalCtx: CanvasRenderingContext2D, width: number, height: number) => {
    // Get original image data
    const originalImageData = originalCtx.getImageData(0, 0, width, height);
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    const originalData = originalImageData.data;

    // Apply filters
    for (let i = 0; i < data.length; i += 4) {
      let r = originalData[i];
      let g = originalData[i + 1];
      let b = originalData[i + 2];
      const a = originalData[i + 3];

      // Brightness
      const brightnessFactor = 1 + settings.brightness / 100;
      r *= brightnessFactor;
      g *= brightnessFactor;
      b *= brightnessFactor;

      // Contrast
      const contrastFactor = (259 * (settings.contrast + 255)) / (255 * (259 - settings.contrast));
      r = contrastFactor * (r - 128) + 128;
      g = contrastFactor * (g - 128) + 128;
      b = contrastFactor * (b - 128) + 128;

      // Saturation
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const saturationFactor = 1 + settings.saturation / 100;
      r = gray + saturationFactor * (r - gray);
      g = gray + saturationFactor * (g - gray);
      b = gray + saturationFactor * (b - gray);

      // Temperature (simplified)
      if (settings.temperature > 0) {
        r += settings.temperature * 2.55;
        b -= settings.temperature * 1.5;
      } else {
        r += settings.temperature * 1.5;
        b -= settings.temperature * 2.55;
      }

      // Clamp values
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
      data[i + 3] = a;
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const applyPreset = (presetName: RealEstatePresetKey) => {
    const preset = REAL_ESTATE_PRESETS[presetName];
    setSettings(prev => ({
      ...prev,
      brightness: preset.brightness,
      contrast: preset.contrast,
      saturation: preset.saturation,
      temperature: preset.temperature
    }));
    toast.success(`Applied ${presetName} preset`);
  };

  const resetSettings = () => {
    setSettings({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      temperature: 0,
      crop: null
    });
  };

  const handleSave = async () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (blob) {
          const enhancedFile = new File([blob], image.file.name, { type: 'image/png' });
          const result = await uploadImage(enhancedFile);
          if (result) {
            toast.success("Image enhanced and saved!");
            onComplete();
          }
        }
      }, 'image/png');
    } catch (error) {
      toast.error("Failed to save enhanced image");
    }
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `enhanced-${image.file.name}`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Enhance Image</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preview */}
        <div className="relative">
          <div className="flex gap-4 justify-center">
            {showBeforeAfter && (
              <div className="text-center">
                <p className="text-sm font-medium mb-2">Before</p>
                <canvas ref={originalCanvasRef} className="border rounded-lg shadow-sm max-w-full max-h-64" />
              </div>
            )}
            <div className="text-center">
              <p className="text-sm font-medium mb-2">
                {showBeforeAfter ? "After" : "Preview"}
              </p>
              <canvas ref={canvasRef} className="border rounded-lg shadow-sm max-w-full max-h-64" />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBeforeAfter(!showBeforeAfter)}
            className="absolute top-8 right-0"
          >
            {showBeforeAfter ? "Hide" : "Show"} Before/After
          </Button>
        </div>

        {/* Presets */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Real Estate Enhancement Presets</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(REAL_ESTATE_PRESETS).map(([presetKey, preset]) => (
              <Button
                key={presetKey}
                variant="outline"
                size="sm"
                onClick={() => applyPreset(presetKey as RealEstatePresetKey)}
                className="text-xs flex-col h-auto py-2 px-3"
              >
                <div className="flex items-center gap-1 mb-1">
                  <Zap className="h-3 w-3" />
                  <span className="font-medium">{presetKey}</span>
                </div>
                <Badge variant="secondary" className="text-xs capitalize">
                  {preset.category}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Manual Controls */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Manual Adjustments</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Brightness</label>
              <Slider
                value={[settings.brightness]}
                onValueChange={([value]) => setSettings(prev => ({ ...prev, brightness: value }))}
                min={-50}
                max={50}
                step={1}
              />
              <span className="text-xs text-muted-foreground">{settings.brightness}%</span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Contrast</label>
              <Slider
                value={[settings.contrast]}
                onValueChange={([value]) => setSettings(prev => ({ ...prev, contrast: value }))}
                min={-50}
                max={50}
                step={1}
              />
              <span className="text-xs text-muted-foreground">{settings.contrast}%</span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Saturation</label>
              <Slider
                value={[settings.saturation]}
                onValueChange={([value]) => setSettings(prev => ({ ...prev, saturation: value }))}
                min={-50}
                max={50}
                step={1}
              />
              <span className="text-xs text-muted-foreground">{settings.saturation}%</span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Temperature</label>
              <Slider
                value={[settings.temperature]}
                onValueChange={([value]) => setSettings(prev => ({ ...prev, temperature: value }))}
                min={-50}
                max={50}
                step={1}
              />
              <span className="text-xs text-muted-foreground">{settings.temperature > 0 ? "Warmer" : settings.temperature < 0 ? "Cooler" : "Neutral"}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex flex-wrap gap-2 justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetSettings}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button variant="outline" onClick={downloadImage}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-1" />
            Save to Library
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};