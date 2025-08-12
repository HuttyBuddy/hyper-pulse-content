import { Helmet } from "react-helmet-async";
import AppHeader from "@/components/layout/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { openCustomerPortal } from "@/lib/billing";

const Profile = () => {
  const [name, setName] = useState("Alex Morgan");
  const [email, setEmail] = useState("alex@example.com");
  const [googleKey, setGoogleKey] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [neighborhood, setNeighborhood] = useState("");
  const [county, setCounty] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [headshotUrl, setHeadshotUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [brokerageLogoUrl, setBrokerageLogoUrl] = useState("");
  const [uploadingHeadshot, setUploadingHeadshot] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBrokerageLogo, setUploadingBrokerageLogo] = useState(false);
  const headshotInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const brokerageLogoInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (!mounted) return;
      if (userErr) {
        console.error(userErr);
        toast("Failed to get user");
        return;
      }
      if (!user) {
        toast("Please log in");
        return;
      }
      setUserId(user.id);
      const { data, error } = await supabase
        .from("profiles")
        .select("name, email, google_api_key, headshot_url, logo_url, brokerage_logo_url, neighborhood, county, state")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) {
        console.error(error);
        toast("Failed to load profile");
        return;
      }
      if (data) {
        setName(data.name ?? "");
        setEmail(data.email ?? "");
        setGoogleKey((data as any).google_api_key ?? "");
        setHeadshotUrl((data as any).headshot_url ?? "");
        setLogoUrl((data as any).logo_url ?? "");
        setBrokerageLogoUrl((data as any).brokerage_logo_url ?? "");
        setNeighborhood((data as any).neighborhood ?? "");
        setCounty((data as any).county ?? "");
        setStateCode((data as any).state ?? "");
      }
    };
    init();
    return () => { mounted = false; };
  }, []);

  const handleSaveProfile = async () => {
    if (!userId) {
      toast("Not signed in");
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .upsert({ user_id: userId, name, email, neighborhood, county, state: stateCode });
    if (error) {
      console.error(error);
      toast("Failed to save profile");
    } else {
      toast("Profile saved");
    }
  };

  const handleSaveKeys = async () => {
    if (!userId) {
      toast("Not signed in");
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .upsert({ user_id: userId, google_api_key: googleKey });
    if (error) {
      console.error(error);
      toast("Failed to save keys");
    } else {
      toast("Keys saved");
    }
  };

  const uploadImage = async (kind: "headshot" | "logo" | "brokerage_logo", file: File) => {
    if (!userId) {
      toast("Not signed in");
      return;
    }
    try {
      const fileExt = file.name.split(".").pop();
      const path = `${userId}/${kind}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("branding").upload(path, file);
      if (uploadError) {
        console.error(uploadError);
        toast("Upload failed");
        return;
      }
      const { data: publicUrlData } = supabase.storage.from("branding").getPublicUrl(path);
      const publicUrl = publicUrlData.publicUrl;
      if (kind === "headshot") {
        setHeadshotUrl(publicUrl);
      } else if (kind === "logo") {
        setLogoUrl(publicUrl);
      } else {
        setBrokerageLogoUrl(publicUrl);
      }
      const payload: any = { user_id: userId };
      if (kind === "headshot") payload.headshot_url = publicUrl;
      else if (kind === "logo") payload.logo_url = publicUrl;
      else payload.brokerage_logo_url = publicUrl;
      const { error: upsertError } = await supabase.from("profiles").upsert(payload as any);
      if (upsertError) {
        console.error(upsertError);
        toast("Saved upload but failed to update profile");
      } else {
        toast("Uploaded and saved");
      }
    } catch (e) {
      console.error(e);
      toast("Unexpected error during upload");
    }
  };

  const onHeadshotSelected = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingHeadshot(true);
    await uploadImage("headshot", file);
    setUploadingHeadshot(false);
    e.target.value = "";
  };

  const onLogoSelected = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    await uploadImage("logo", file);
    setUploadingLogo(false);
    e.target.value = "";
  };

  const onBrokerageLogoSelected = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBrokerageLogo(true);
    await uploadImage("brokerage_logo", file);
    setUploadingBrokerageLogo(false);
    e.target.value = "";
  };

  const [openingPortal, setOpeningPortal] = useState(false);

  return (
    <>
      <Helmet>
        <title>Profile & Settings — The Hyper-Local Pulse</title>
        <meta name="description" content="Manage your profile, branding assets, subscription, and API keys." />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : '/profile'} />
      </Helmet>
      <AppHeader />
      <main className="container py-8 grid gap-6">
        <section className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Keep your details up to date</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="name" className="text-sm">Name</label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label htmlFor="email" className="text-sm">Email</label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label htmlFor="neighborhood" className="text-sm">Neighborhood</label>
                <Input id="neighborhood" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="e.g., Carmichael" />
              </div>
              <div>
                <label htmlFor="county" className="text-sm">County</label>
                <Input id="county" value={county} onChange={(e) => setCounty(e.target.value)} placeholder="e.g., Sacramento County" />
              </div>
              <div>
                <label htmlFor="state" className="text-sm">State</label>
                <Input id="state" value={stateCode} onChange={(e) => setStateCode(e.target.value)} placeholder="e.g., CA" />
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={handleSaveProfile}>Save</Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      setOpeningPortal(true);
                      await openCustomerPortal();
                    } finally {
                      setOpeningPortal(false);
                    }
                  }}
                  disabled={openingPortal}
                >
                  {openingPortal ? "Opening…" : "Manage Subscription"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My Branding Assets</CardTitle>
              <CardDescription>Upload your headshot and brokerage logo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm mb-1">Headshot</div>
                <div
                  className="w-[1in] rounded-md border bg-muted mb-2 overflow-hidden cursor-pointer"
                  onClick={() => headshotInputRef.current?.click()}
                  role="button"
                  aria-label="Upload headshot"
                >
                  <AspectRatio ratio={1} className="w-full">
                    {headshotUrl ? (
                      <img
                        src={headshotUrl}
                        alt="Realtor headshot branding image"
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full grid place-items-center text-xs text-muted-foreground">
                        Click to upload headshot
                      </div>
                    )}
                  </AspectRatio>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => headshotInputRef.current?.click()}
                    disabled={uploadingHeadshot}
                  >
                    {uploadingHeadshot ? "Uploading..." : "Upload Headshot"}
                  </Button>
                </div>
                <input
                  ref={headshotInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onHeadshotSelected}
                />
              </div>
              <div>
                <div className="text-sm mb-1">Personal Logo</div>
                <div
                  className="w-[1in] rounded-md border bg-muted mb-2 overflow-hidden cursor-pointer"
                  onClick={() => logoInputRef.current?.click()}
                  role="button"
                  aria-label="Upload personal logo"
                >
                  <AspectRatio ratio={1} className="w-full">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Personal logo branding image"
                        className="h-full w-full object-contain bg-background"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full grid place-items-center text-xs text-muted-foreground">
                        Click to upload logo
                      </div>
                    )}
                  </AspectRatio>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                  >
                    {uploadingLogo ? "Uploading..." : "Upload Logo"}
                  </Button>
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onLogoSelected}
                />
              </div>
            <div>
              <div className="text-sm mb-1">Brokerage Logo</div>
               <div
                 className="w-[1in] rounded-md border bg-muted mb-2 overflow-hidden cursor-pointer"
                 onClick={() => brokerageLogoInputRef.current?.click()}
                 role="button"
                 aria-label="Upload brokerage logo"
               >
                 <AspectRatio ratio={1} className="w-full">
                   {brokerageLogoUrl ? (
                     <img
                       src={brokerageLogoUrl}
                       alt="Brokerage logo branding image"
                       className="h-full w-full object-contain bg-background"
                       loading="lazy"
                     />
                   ) : (
                     <div className="h-full w-full grid place-items-center text-xs text-muted-foreground">
                       Click to upload brokerage logo
                     </div>
                   )}
                 </AspectRatio>
               </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => brokerageLogoInputRef.current?.click()}
                  disabled={uploadingBrokerageLogo}
                >
                  {uploadingBrokerageLogo ? "Uploading..." : "Upload Brokerage Logo"}
                </Button>
              </div>
              <input
                ref={brokerageLogoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onBrokerageLogoSelected}
              />
            </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Store your Google AI keys for generation features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label htmlFor="googleKey" className="text-sm">Google AI API Key</label>
                <Input id="googleKey" value={googleKey} onChange={(e) => setGoogleKey(e.target.value)} placeholder="Enter key…" />
              </div>
              <Button variant="secondary" onClick={handleSaveKeys}>Save Keys</Button>
            </CardContent>
          </Card>
        </section>

        <div className="pt-2">
          <Button variant="outline" onClick={() => toast("Logged out (demo)")}>Log Out</Button>
        </div>
      </main>
    </>
  );
};

export default Profile;
