import { Helmet } from "react-helmet-async";
import AppHeader from "@/components/layout/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Download, Save } from "lucide-react";
const initialContent = `**MARKET SNAPSHOT**

Carmichael continues to shine this month with steady buyer interest and well-priced listings moving quickly. The current market reflects a balanced environment where strategic pricing and quality presentation drive results. Local favorites like the Jensen Botanical Garden and the American River Parkway keep lifestyle appeal strong, while proximity to downtown Sacramento maintains strong demand.

**MARKET ANALYSIS**

Median days on market remain competitive at 18-25 days, significantly faster than the regional average of 32 days. This acceleration indicates continued buyer confidence and inventory absorption. Price reductions have been modest, averaging 2.8% compared to 4.1% in nearby zip codes, suggesting sellers are pricing strategically from the start.

The inventory landscape shows 2.1 months of supply, maintaining a slight seller's market advantage. New listings are entering at a steady pace, but well-positioned properties continue to see multiple offer scenarios within the first week.

**BUYER & SELLER INSIGHTS**

In this week's highlights, three newly remodeled ranch-style homes drew multiple offers within 7 days, with final sale prices averaging 103% of list price. Two premium properties featuring outdoor living spaces captured above-ask results, demonstrating buyer priorities for move-in ready homes with entertainment value.

For buyers, mortgage rates have stabilized in the mid-6% range, creating more predictable financing scenarios. Pre-approval remains essential, as competitive situations still favor cash-equivalent offers and quick closing timelines.

Sellers are finding success with energy-efficient upgrades and modern finishes. Properties showcasing smart home features and sustainable improvements are commanding premium interest from environmentally conscious buyers.

**NEIGHBORHOOD SPOTLIGHT**

Carmichael's appeal extends beyond its tree-lined streets to encompass top-rated schools, recreational amenities, and community connectivity. The Carmichael Park expansion project, set to complete this fall, will add 15 acres of recreational space and upgraded sports facilities.

Recent infrastructure improvements along Fair Oaks Boulevard have enhanced walkability and cycling access, while the weekly Farmers Market continues to strengthen community bonds. The proximity to American River Parkway provides residents with year-round outdoor recreation just minutes from home.

**MARKET FORECAST**

Looking ahead, seasonal patterns suggest continued stability through the fall months. Economic indicators point to sustained demand, with employment growth in the Sacramento region supporting homebuying activity. 

Buyers should expect continued competition for well-priced homes, while sellers can capitalize on low inventory levels by ensuring their properties stand out through professional staging and strategic improvements. The next 90 days present optimal conditions for both transactions and strategic market positioning.`;
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
      const {
        data,
        error
      } = await supabase.functions.invoke('export-branded-pdf', {
        body: {
          content,
          appendBranding
        }
      });
      if (error) throw error;
      if (data?.downloadUrl) {
        // Create a temporary download link
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = 'newsletter.html';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast("Newsletter exported! Check your downloads folder.");
      } else {
        throw new Error('No download URL provided');
      }
    } catch (error: any) {
      console.error('Export error:', error);
      toast(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  }, [content, appendBranding]);
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
        <title>Customize & Brand — The Hyper-Local Pulse</title>
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
            <Button variant="hero" onClick={exportBrandedPDF} disabled={isExporting} className="w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export Branded PDF'}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_360px]">
          <Card className="shadow-elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Newsletter / Blog Content</CardTitle>
                  <CardDescription>Edit the text as needed</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={generateSmartContent} disabled={isGenerating || !userProfile?.neighborhood}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isGenerating ? 'Generating...' : 'Generate Smart Content'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <textarea value={content} onChange={e => setContent(e.target.value)} className="w-full min-h-[420px] rounded-md border border-input bg-background p-4 leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Your newsletter content will appear here..." />
            </CardContent>
          </Card>

            <aside>
              <Card className="shadow-elevated lg:sticky lg:top-24">
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl">Your Branding</CardTitle>
                  <CardDescription>Assets and signature details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 md:space-y-5">
                <div>
                  <div className="text-sm mb-1">Agent Headshot </div>
                  <div className="w-[1in] h-[1in] rounded-md border bg-muted overflow-hidden cursor-pointer relative" onClick={() => headshotInputRef.current?.click()} aria-label="Upload agent headshot">
                    {headshotUrl ? <img src={headshotUrl} alt="Agent headshot square 1x1 inch" className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full grid place-items-center text-xs text-muted-foreground">
                        Click to upload
                      </div>}
                    {uploading.headshot ? <div className="absolute inset-0 bg-background/60 grid place-items-center text-xs">
                        Uploading…
                      </div> : null}
                  </div>
                </div>

                <div>
                  <div className="text-sm mb-1">Personal Logo </div>
                  <div className="w-[1in] h-[1in] rounded-md border bg-muted overflow-hidden cursor-pointer relative" onClick={() => logoInputRef.current?.click()} aria-label="Upload personal logo">
                    {logoUrl ? <img src={logoUrl} alt="Personal logo square 1x1 inch" className="w-full h-full object-contain p-1" loading="lazy" /> : <div className="w-full h-full grid place-items-center text-xs text-muted-foreground">
                        Click to upload
                      </div>}
                    {uploading.logo ? <div className="absolute inset-0 bg-background/60 grid place-items-center text-xs">
                        Uploading…
                      </div> : null}
                  </div>
                </div>

                <div>
                  <div className="text-sm mb-1">Brokerage Logo</div>
                  <div className="w-[1in] h-[1in] rounded-md border bg-muted overflow-hidden cursor-pointer relative" onClick={() => brokerageInputRef.current?.click()} aria-label="Upload brokerage logo">
                    {brokerageLogoUrl ? <img src={brokerageLogoUrl} alt="Brokerage logo square 1x1 inch" className="w-full h-full object-contain p-1" loading="lazy" /> : <div className="w-full h-full grid place-items-center text-xs text-muted-foreground">
                        Click to upload
                      </div>}
                    {uploading.brokerage_logo ? <div className="absolute inset-0 bg-background/60 grid place-items-center text-xs">
                        Uploading…
                      </div> : null}
                  </div>
                </div>

                    <div className="flex items-center justify-between py-2">
                      <div>
                        <div className="font-medium text-sm md:text-base">Append my branding to this post</div>
                        <div className="text-xs md:text-sm text-muted-foreground">Adds your headshot, personal and brokerage logos to the footer</div>
                      </div>
                      <Switch checked={appendBranding} onCheckedChange={setAppendBranding} />
                    </div>

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