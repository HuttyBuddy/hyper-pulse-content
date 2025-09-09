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
import { handleCriticalAuthError } from "@/lib/auth";

const Profile = () => {
  const [name, setName] = useState("Alex Morgan");
  const [email, setEmail] = useState("alex@example.com");
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
  const [crmType, setCrmType] = useState("");
  const [crmApiKey, setCrmApiKey] = useState("");
  const [crmSettings, setCrmSettings] = useState("{}");
  const [testingCrm, setTestingCrm] = useState(false);
  const headshotInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const brokerageLogoInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const {
        data: {
          user
        },
        error: userErr
      } = await supabase.auth.getUser();
      if (!mounted) return;
      if (userErr) {
        console.error(userErr);
        await handleCriticalAuthError(userErr);
        return;
      }
      if (!user) {
        console.warn("No authenticated user found");
        return;
      }
      setUserId(user.id);
      const {
        data,
        error
      } = await supabase.from("profiles").select("name, email, headshot_url, logo_url, brokerage_logo_url, neighborhood, county, state, crm_type, crm_api_key, crm_settings").eq("user_id", user.id).maybeSingle();
      if (error) {
        console.error(error);
        toast("Failed to load profile");
        return;
      }
      if (data) {
        setName(data.name ?? "");
        setEmail(data.email ?? "");
        setHeadshotUrl((data as any).headshot_url ?? "");
        setLogoUrl((data as any).logo_url ?? "");
        setBrokerageLogoUrl((data as any).brokerage_logo_url ?? "");
        setNeighborhood((data as any).neighborhood ?? "");
        setCounty((data as any).county ?? "");
        setStateCode((data as any).state ?? "");
        setCrmType((data as any).crm_type ?? "");
        setCrmApiKey((data as any).crm_api_key ?? "");
        setCrmSettings(JSON.stringify((data as any).crm_settings ?? {}, null, 2));
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, []);
  const handleSaveProfile = async () => {
    if (!userId) {
      toast("Not signed in");
      return;
    }
    const {
      error
    } = await supabase.from("profiles").upsert({
      user_id: userId,
      name,
      email,
      neighborhood,
      county,
      state: stateCode,
      crm_type: crmType || null,
      crm_api_key: crmApiKey || null,
      crm_settings: crmSettings ? JSON.parse(crmSettings) : {}
    });
    if (error) {
      console.error(error);
      toast("Failed to save profile");
    } else {
      toast("Profile saved");
    }
  };
  const testCrmConnection = async () => {
    if (!crmType || !crmApiKey) {
      toast("Please select CRM type and enter API key first");
      await handleCriticalAuthError("Auth session missing!");
      return;
    }

    setTestingCrm(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-crm-contacts', {
        body: { limit: 1 }
      });

      if (error) throw error;

      if (data?.success) {
        toast("CRM connection successful!");
      } else {
        throw new Error(data?.error || "Connection test failed");
      }
    } catch (error: any) {
      console.error('CRM test error:', error);
      toast(`CRM connection failed: ${error.message}`);
    } finally {
      setTestingCrm(false);
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
      const {
        error: uploadError
      } = await supabase.storage.from("branding").upload(path, file);
      if (uploadError) {
        console.error(uploadError);
        toast("Upload failed");
        return;
      }
      const {
        data: publicUrlData
      } = supabase.storage.from("branding").getPublicUrl(path);
      const publicUrl = publicUrlData.publicUrl;
      if (kind === "headshot") {
        setHeadshotUrl(publicUrl);
      } else if (kind === "logo") {
        setLogoUrl(publicUrl);
      } else {
        setBrokerageLogoUrl(publicUrl);
      }
      const payload: any = {
        user_id: userId
      };
      if (kind === "headshot") payload.headshot_url = publicUrl;else if (kind === "logo") payload.logo_url = publicUrl;else payload.brokerage_logo_url = publicUrl;
      const {
        error: upsertError
      } = await supabase.from("profiles").upsert(payload as any);
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
  return <>
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
                <Input id="name" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label htmlFor="email" className="text-sm">Email</label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div>
                <label htmlFor="neighborhood" className="text-sm">Neighborhood</label>
                <Input id="neighborhood" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} placeholder="e.g., Carmichael" />
              </div>
              <div>
                <label htmlFor="county" className="text-sm">County</label>
                <Input id="county" value={county} onChange={e => setCounty(e.target.value)} placeholder="e.g., Sacramento County" />
              </div>
              <div>
                <label htmlFor="state" className="text-sm">State</label>
                <Input id="state" value={stateCode} onChange={e => setStateCode(e.target.value)} placeholder="e.g., CA" />
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={handleSaveProfile}>Save</Button>
                <Button variant="outline" onClick={async () => {
                try {
                  setOpeningPortal(true);
                  await openCustomerPortal();
                } finally {
                  setOpeningPortal(false);
                }
              }} disabled={openingPortal}>
                  {openingPortal ? "Opening…" : "Manage Subscription"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My Branding Assets</CardTitle>
              <CardDescription>Upload your headshot, personal logo, and brokerage logo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm mb-1">Headshot</div>
                <div className="w-[1in] rounded-md border bg-muted mb-2 overflow-hidden cursor-pointer" onClick={() => headshotInputRef.current?.click()} role="button" aria-label="Upload headshot">
                  <AspectRatio ratio={1} className="w-full">
                     {headshotUrl ? <img src={headshotUrl} alt="Realtor headshot branding image" className="h-full w-full object-cover" loading="lazy" /> : <div className="h-full w-full grid place-items-center text-xs text-muted-foreground text-center">
                        Click to upload headshot
                      </div>}
                  </AspectRatio>
                </div>
                <input ref={headshotInputRef} type="file" accept="image/*" className="hidden" onChange={onHeadshotSelected} />
              </div>
              <div>
                <div className="text-sm mb-1">Personal Logo</div>
                <div className="w-[1in] rounded-md border bg-muted mb-2 overflow-hidden cursor-pointer" onClick={() => logoInputRef.current?.click()} role="button" aria-label="Upload personal logo">
                  <AspectRatio ratio={1} className="w-full">
                    {logoUrl ? <img src={logoUrl} alt="Personal logo branding image" className="h-full w-full object-contain bg-background" loading="lazy" /> : <div className="h-full w-full grid place-items-center text-xs text-muted-foreground text-center">
                        Click to upload logo
                      </div>}
                  </AspectRatio>
                </div>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={onLogoSelected} />
              </div>
            <div>
              <div className="text-sm mb-1">Brokerage Logo</div>
               <div className="w-[1in] rounded-md border bg-muted mb-2 overflow-hidden cursor-pointer" onClick={() => brokerageLogoInputRef.current?.click()} role="button" aria-label="Upload brokerage logo">
                 <AspectRatio ratio={1} className="w-full">
                    {brokerageLogoUrl ? <img src={brokerageLogoUrl} alt="Brokerage logo branding image" className="h-full w-full object-contain bg-background" loading="lazy" /> : <div className="h-full w-full grid place-items-center text-xs text-muted-foreground text-center">
                        Click to upload brokerage logo
                      </div>}
                 </AspectRatio>
                </div>
              <input ref={brokerageLogoInputRef} type="file" accept="image/*" className="hidden" onChange={onBrokerageLogoSelected} />
            </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>CRM Integration</CardTitle>
              <CardDescription>Connect your CRM system for seamless lead management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="crmType" className="text-sm">CRM System</label>
                <select
                  id="crmType"
                  value={crmType}
                  onChange={(e) => setCrmType(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="">Select CRM</option>
                  <option value="hubspot">HubSpot</option>
                  <option value="salesforce">Salesforce</option>
                  <option value="pipedrive">Pipedrive</option>
                  <option value="followupboss">Follow Up Boss</option>
                </select>
              </div>
              <div>
                <label htmlFor="crmApiKey" className="text-sm">API Key</label>
                <Input
                  id="crmApiKey"
                  type="password"
                  value={crmApiKey}
                  onChange={(e) => setCrmApiKey(e.target.value)}
                  placeholder="Enter your CRM API key"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your API key is stored securely and never shared
                </p>
              </div>
              <div>
                <label htmlFor="crmSettings" className="text-sm">CRM Settings (JSON)</label>
                <textarea
                  id="crmSettings"
                  value={crmSettings}
                  onChange={(e) => setCrmSettings(e.target.value)}
                  placeholder='{"instance_url": "https://your-instance.salesforce.com", "default_owner_id": "123"}'
                  className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background min-h-[80px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Additional settings specific to your CRM (optional)
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={handleSaveProfile}>Save CRM Settings</Button>
                <Button 
                  variant="outline" 
                  onClick={testCrmConnection}
                  disabled={testingCrm || !crmType || !crmApiKey}
                >
                  {testingCrm ? "Testing..." : "Test Connection"}
                </Button>
              </div>
              {crmType && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Setup Instructions for {crmType}:</h4>
                  <div className="text-xs text-muted-foreground space-y-1">
                    {crmType === 'hubspot' && (
                      <>
                        <p>1. Go to HubSpot Settings → Integrations → Private Apps</p>
                        <p>2. Create a new private app with CRM scopes</p>
                        <p>3. Copy the access token and paste it above</p>
                      </>
                    )}
                    {crmType === 'salesforce' && (
                      <>
                        <p>1. Create a Connected App in Salesforce Setup</p>
                        <p>2. Generate OAuth credentials</p>
                        <p>3. Add your instance URL to CRM Settings</p>
                      </>
                    )}
                    {crmType === 'pipedrive' && (
                      <>
                        <p>1. Go to Pipedrive Settings → Personal Preferences → API</p>
                        <p>2. Copy your API token</p>
                        <p>3. Add your company domain to CRM Settings</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <div className="pt-2">
          <Button variant="outline" onClick={() => toast("Logged out (demo)")}>Log Out</Button>
        </div>
      </main>
    </>;
};
export default Profile;