import { Helmet } from "react-helmet-async";
import AppHeader from "@/components/layout/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Download, Save } from "lucide-react";
import { format } from "date-fns";
import { initialContent } from "@/constants/editorContent";

const Editor = () => {
  const [content, setContent] = useState(initialContent);
  const [appendBranding, setAppendBranding] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [headshotUrl, setHeadshotUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [brokerageLogoUrl, setBrokerageLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState<{
    headshot?: boolean;
    logo?: boolean;
    brokerage_logo?: boolean;
  }>({});
  const [exportFormat, setExportFormat] = useState<'html' | 'pdf'>('html');
  const headshotInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const brokerageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      const {
        data,
        error
      } = await supabase.from('profiles').select('headshot_url, logo_url, brokerage_logo_url, name, email, neighborhood, county, state').eq('user_id', user.id).maybeSingle();
      if (!error && mounted) {
        setUserProfile(data);
        setHeadshotUrl(data?.headshot_url ?? null);
        setLogoUrl(data?.logo_url ?? null);
        setBrokerageLogoUrl(data?.brokerage_logo_url ?? null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const generateSmartContent = useCallback(async () => {
    if (!userProfile) {
      toast("Please set up your profile with neighborhood information first.");
      return;
    }
    setIsGenerating(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('generate-newsletter-content', {
        body: {
          neighborhood: userProfile.neighborhood,
          county: userProfile.county,
          state: userProfile.state
        }
      });
      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }
      if (data?.content) {
        setContent(data.content);
        toast("Smart content generated from your market data!");
      } else {
        console.error('No content in response:', data);
        throw new Error('No content generated');
      }
    } catch (error: any) {
      console.error('Content generation error:', error);
      toast(`Content generation failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  }, [userProfile]);

  const saveChanges = useCallback(async () => {
    setIsSaving(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('save-newsletter-draft', {
        body: {
          content,
          title: null,
          brandingPreferences: {
            appendBranding
          }
        }
      });
      if (error) throw error;
      toast("Newsletter draft saved successfully!");
    } catch (error: any) {
      console.error('Save error:', error);
      toast(`Save failed: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  }, [content, appendBranding]);

  const exportBrandedPDF = useCallback(async () => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-branded-content', {
        body: {
          content,
          appendBranding,
          format: exportFormat,
          title: `Market Analysis - ${format(new Date(), 'MMMM d, yyyy')}`
        }
      });
      if (error) throw error;
      if (data?.downloadUrl || data?.htmlContent) {
        // Create a temporary download link
        const link = document.createElement('a');
        link.href = data.downloadUrl || `data:text/html;charset=utf-8,${encodeURIComponent(data.htmlContent)}`;
        link.download = exportFormat === 'pdf' ? 'market-analysis.pdf' : 'market-analysis.html';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast(`Market analysis exported as ${exportFormat.toUpperCase()}! Check your downloads folder.`);
      } else {
        throw new Error('No download URL provided');
      }
    } catch (error: any) {
      console.error('Export error:', error);
      toast(`Export failed: ${error.message || 'Please try again'}`);
    } finally {
      setIsExporting(false);
    }
  }, [content, appendBranding, exportFormat]);

  const toSquareImageBlob = (file: File, size = 96): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas not supported'));
          return;
        }
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        canvas.toBlob(blob => {
          if (blob) resolve(blob);else reject(new Error('Image processing failed'));
        }, 'image/png');
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadImage = async (kind: 'headshot' | 'logo' | 'brokerage_logo', file: File) => {
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();
    if (!user) {
      toast("Please sign in to upload images.");
      return;
    }
    setUploading(u => ({
      ...u,
      [kind]: true
    }));
    try {
      const squareBlob = await toSquareImageBlob(file, 96);
      const filename = `${kind}_${Date.now()}.png`;
      const path = `${user.id}/${filename}`;
      const {
        error: uploadError
      } = await supabase.storage.from('branding').upload(path, squareBlob, {
        upsert: true,
        contentType: 'image/png',
        cacheControl: '3600'
      });
      if (uploadError) throw uploadError;
      const {
        data: publicData
      } = supabase.storage.from('branding').getPublicUrl(path);
      const publicUrl = publicData.publicUrl;
      const columnMap = {
        headshot: {
          column: 'headshot_url',
          setter: setHeadshotUrl
        },
        logo: {
          column: 'logo_url',
          setter: setLogoUrl
        },
        brokerage_logo: {
          column: 'brokerage_logo_url',
          setter: setBrokerageLogoUrl
        }
      } as const;
      const {
        column,
        setter
      } = columnMap[kind];
      const {
        data: updateData,
        error: updateError
      } = await supabase.from('profiles').update({
        [column]: publicUrl
      }).eq('user_id', user.id).select().maybeSingle();
      if (updateError) {
        throw updateError;
      }
      if (!updateData) {
        const {
          error: insertError
        } = await supabase.from('profiles').insert({
          user_id: user.id,
          [column]: publicUrl
        });
        if (insertError) throw insertError;
      }
      setter(publicUrl);
      toast("Image uploaded and saved.");
    } catch (err: any) {
      console.error(err);
      toast(`Upload failed: ${err.message ?? 'Unknown error'}`);
    } finally {
      setUploading(u => ({
        ...u,
        [kind]: false
      }));
    }
  };

  const onSelect = (kind: 'headshot' | 'logo' | 'brokerage_logo') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(kind, file);
  };

  return <>
      <Helmet>
        <title>Customize & Brand — Hyper Pulse Content</title>
        <meta name="description" content="Edit your blog content and append your branding before exporting." />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : '/editor'} />
      </Helmet>
      <AppHeader />
      <main className="container px-3 md:px-4 py-4 md:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 md:mb-6">
          <h1 className="text-xl md:text-3xl font-semibold tracking-tight truncate">Customize & Brand</h1>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="secondary" onClick={saveChanges} disabled={isSaving} className="w-full sm:w-auto">
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <div className="flex gap-2">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as 'html' | 'pdf')}
                className="px-3 py-2 border border-input rounded-md bg-background text-sm"
              >
                <option value="html">HTML</option>
                <option value="pdf">PDF</option>
              </select>
              <Button variant="hero" onClick={exportBrandedPDF} disabled={isExporting} className="flex-1 sm:flex-none">
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? 'Exporting...' : `Export ${exportFormat.toUpperCase()}`}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_360px]">
          <Card className="shadow-elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Market Analysis Content</CardTitle>
                  <CardDescription>Professional content ready for your marketing channels</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={generateSmartContent} disabled={isGenerating || !userProfile?.neighborhood}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isGenerating ? 'Generating...' : 'Generate Fresh Content'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm text-primary font-medium">✨ AI-Powered Content</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This content is generated using real market data and local insights to position you as the neighborhood expert.
                </p>
              </div>
              <textarea 
                value={content} 
                onChange={e => setContent(e.target.value)} 
                className="w-full min-h-[420px] rounded-md border border-input bg-background p-4 leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" 
                placeholder="Your market analysis content will appear here..."
              />
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>{content.length} characters</span>
                <span>~{Math.ceil(content.split(' ').length / 200)} min read</span>
              </div>
            </CardContent>
          </Card>

          <aside>
            <Card className="shadow-elevated lg:sticky lg:top-24">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Professional Branding</CardTitle>
                <CardDescription>Your brand assets for consistent marketing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 md:space-y-5">
                <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                  <p className="text-sm text-primary font-medium">🎯 Brand Consistency</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload your professional assets to maintain consistent branding across all content.
                  </p>
                </div>

                <div>
                  <div className="text-sm mb-2 font-medium">Agent Headshot</div>
                  <div className="w-[1in] h-[1in] rounded-md border bg-muted overflow-hidden cursor-pointer relative hover:border-primary/50 transition-colors" onClick={() => headshotInputRef.current?.click()} aria-label="Upload agent headshot">
                    {headshotUrl ? <img src={headshotUrl} alt="Agent headshot square 1x1 inch" className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full grid place-items-center text-xs text-muted-foreground text-center">
                        Click to upload professional headshot
                      </div>}
                    {uploading.headshot ? <div className="absolute inset-0 bg-background/60 grid place-items-center text-xs">
                        Uploading…
                      </div> : null}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Square format recommended</p>
                </div>

                <div>
                  <div className="text-sm mb-2 font-medium">Personal Logo</div>
                  <div className="w-[1in] h-[1in] rounded-md border bg-muted overflow-hidden cursor-pointer relative hover:border-primary/50 transition-colors" onClick={() => logoInputRef.current?.click()} aria-label="Upload personal logo">
                    {logoUrl ? <img src={logoUrl} alt="Personal logo square 1x1 inch" className="w-full h-full object-contain p-1" loading="lazy" /> : <div className="w-full h-full grid place-items-center text-xs text-muted-foreground text-center">
                        Click to upload personal logo
                      </div>}
                    {uploading.logo ? <div className="absolute inset-0 bg-background/60 grid place-items-center text-xs">
                        Uploading…
                      </div> : null}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">PNG with transparent background preferred</p>
                </div>

                <div>
                  <div className="text-sm mb-2 font-medium">Brokerage Logo</div>
                  <div className="w-[1in] h-[1in] rounded-md border bg-muted overflow-hidden cursor-pointer relative hover:border-primary/50 transition-colors" onClick={() => brokerageInputRef.current?.click()} aria-label="Upload brokerage logo">
                    {brokerageLogoUrl ? <img src={brokerageLogoUrl} alt="Brokerage logo square 1x1 inch" className="w-full h-full object-contain p-1" loading="lazy" /> : <div className="w-full h-full grid place-items-center text-xs text-muted-foreground text-center">
                        Click to upload brokerage logo
                      </div>}
                    {uploading.brokerage_logo ? <div className="absolute inset-0 bg-background/60 grid place-items-center text-xs">
                        Uploading…
                      </div> : null}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">High-resolution logo recommended</p>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <div className="font-medium text-sm md:text-base">Include my branding</div>
                      <div className="text-xs md:text-sm text-muted-foreground">Add your professional assets to exported content</div>
                    </div>
                    <Switch checked={appendBranding} onCheckedChange={setAppendBranding} />
                  </div>
                </div>

                {appendBranding && (headshotUrl || logoUrl || brokerageLogoUrl) && (
                  <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span className="text-sm font-medium text-green-800">Branding Ready!</span>
                    </div>
                    <p className="text-xs text-green-700 mt-1">
                      Your professional assets will be included in exported content.
                    </p>
                  </div>
                )}

                <input ref={headshotInputRef} type="file" accept="image/*" className="hidden" onChange={onSelect('headshot')} />
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={onSelect('logo')} />
                <input ref={brokerageInputRef} type="file" accept="image/*" className="hidden" onChange={onSelect('brokerage_logo')} />
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </>;
};

export default Editor;