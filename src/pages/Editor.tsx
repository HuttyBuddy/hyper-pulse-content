import { Helmet } from "react-helmet-async";
import AppHeader from "@/components/layout/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const initialContent = `Carmichael continues to shine this month with steady buyer interest and well-priced listings moving quickly. Local favorites like the Jensen Botanical Garden and the American River Parkway keep lifestyle appeal strong. Median days on market remain competitive, and price reductions are modest compared to nearby zip codes.

In this week’s highlights, three newly remodeled ranch-style homes drew multiple offers within 7 days, while two premium properties with outdoor living spaces captured above-ask results. With mortgage rates stabilizing, seller confidence remains healthy and buyers are prioritizing move-in ready, energy-efficient upgrades.`;

const Editor = () => {
  const [content, setContent] = useState(initialContent);
  const [appendBranding, setAppendBranding] = useState(true);

  const [headshotUrl, setHeadshotUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [brokerageLogoUrl, setBrokerageLogoUrl] = useState<string | null>(null);

  const [uploading, setUploading] = useState<{ headshot?: boolean; logo?: boolean; brokerage_logo?: boolean }>({});

  const headshotInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const brokerageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('headshot_url, logo_url, brokerage_logo_url')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!error && mounted) {
        setHeadshotUrl(data?.headshot_url ?? null);
        setLogoUrl(data?.logo_url ?? null);
        setBrokerageLogoUrl(data?.brokerage_logo_url ?? null);
      }
    })();
    return () => { mounted = false; };
  }, []);

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
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Image processing failed'));
        }, 'image/png');
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadImage = async (kind: 'headshot' | 'logo' | 'brokerage_logo', file: File) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast("Please sign in to upload images.");
      return;
    }
    setUploading((u) => ({ ...u, [kind]: true }));
    try {
      const squareBlob = await toSquareImageBlob(file, 96);
      const filename = `${kind}_${Date.now()}.png`;
      const path = `${user.id}/${filename}`;

      const { error: uploadError } = await supabase.storage
        .from('branding')
        .upload(path, squareBlob, { upsert: true, contentType: 'image/png', cacheControl: '3600' });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from('branding').getPublicUrl(path);
      const publicUrl = publicData.publicUrl;

      const columnMap = {
        headshot: { column: 'headshot_url', setter: setHeadshotUrl },
        logo: { column: 'logo_url', setter: setLogoUrl },
        brokerage_logo: { column: 'brokerage_logo_url', setter: setBrokerageLogoUrl },
      } as const;

      const { column, setter } = columnMap[kind];

      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({ [column]: publicUrl })
        .eq('user_id', user.id)
        .select()
        .maybeSingle();

      if (updateError) {
        throw updateError;
      }

      if (!updateData) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({ user_id: user.id, [column]: publicUrl });
        if (insertError) throw insertError;
      }

      setter(publicUrl);
      toast("Image uploaded and saved.");
    } catch (err: any) {
      console.error(err);
      toast(`Upload failed: ${err.message ?? 'Unknown error'}`);
    } finally {
      setUploading((u) => ({ ...u, [kind]: false }));
    }
  };

  const onSelect = (kind: 'headshot' | 'logo' | 'brokerage_logo') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(kind, file);
  };

  return (
    <>
      <Helmet>
        <title>Customize & Brand — The Hyper-Local Pulse</title>
        <meta name="description" content="Edit your blog content and append your branding before exporting." />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : '/editor'} />
      </Helmet>
      <AppHeader />
      <main className="container py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Customize & Brand</h1>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => toast("Saved (demo)")}>Save Changes</Button>
            <Button variant="hero" onClick={() => toast("Exporting branded PDF… (demo)")}>Export Branded PDF</Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_360px]">
          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle>Newsletter / Blog Content</CardTitle>
              <CardDescription>Edit the text as needed</CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full min-h-[420px] rounded-md border border-input bg-background p-4 leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </CardContent>
          </Card>

          <aside>
            <Card className="shadow-elevated sticky top-24">
              <CardHeader>
                <CardTitle>Your Branding</CardTitle>
                <CardDescription>Assets and signature details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <div className="text-sm mb-1">Agent Headshot (1×1 in)</div>
                  <div
                    className="w-[1in] h-[1in] rounded-md border bg-muted overflow-hidden cursor-pointer relative"
                    onClick={() => headshotInputRef.current?.click()}
                    aria-label="Upload agent headshot"
                  >
                    {headshotUrl ? (
                      <img
                        src={headshotUrl}
                        alt="Agent headshot square 1x1 inch"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-xs text-muted-foreground">
                        Click to upload
                      </div>
                    )}
                    {uploading.headshot ? (
                      <div className="absolute inset-0 bg-background/60 grid place-items-center text-xs">
                        Uploading…
                      </div>
                    ) : null}
                  </div>
                </div>

                <div>
                  <div className="text-sm mb-1">Personal Logo (1×1 in)</div>
                  <div
                    className="w-[1in] h-[1in] rounded-md border bg-muted overflow-hidden cursor-pointer relative"
                    onClick={() => logoInputRef.current?.click()}
                    aria-label="Upload personal logo"
                  >
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Personal logo square 1x1 inch"
                        className="w-full h-full object-contain p-1"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-xs text-muted-foreground">
                        Click to upload
                      </div>
                    )}
                    {uploading.logo ? (
                      <div className="absolute inset-0 bg-background/60 grid place-items-center text-xs">
                        Uploading…
                      </div>
                    ) : null}
                  </div>
                </div>

                <div>
                  <div className="text-sm mb-1">Brokerage Logo (1×1 in)</div>
                  <div
                    className="w-[1in] h-[1in] rounded-md border bg-muted overflow-hidden cursor-pointer relative"
                    onClick={() => brokerageInputRef.current?.click()}
                    aria-label="Upload brokerage logo"
                  >
                    {brokerageLogoUrl ? (
                      <img
                        src={brokerageLogoUrl}
                        alt="Brokerage logo square 1x1 inch"
                        className="w-full h-full object-contain p-1"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-xs text-muted-foreground">
                        Click to upload
                      </div>
                    )}
                    {uploading.brokerage_logo ? (
                      <div className="absolute inset-0 bg-background/60 grid place-items-center text-xs">
                        Uploading…
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-medium">Append my branding to this post</div>
                    <div className="text-sm text-muted-foreground">Adds your headshot, personal and brokerage logos to the footer</div>
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
    </>
  );
};

export default Editor;
