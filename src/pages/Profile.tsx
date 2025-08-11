import { Helmet } from "react-helmet-async";
import AppHeader from "@/components/layout/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "@/components/ui/sonner";

const Profile = () => {
  const [name, setName] = useState("Alex Morgan");
  const [email, setEmail] = useState("alex@example.com");
  const [googleKey, setGoogleKey] = useState("");

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
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => toast("Saved (demo)")}>Save</Button>
                <Button variant="outline" onClick={() => toast("Manage subscription (demo)")}>Manage Subscription</Button>
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
                <div className="h-24 rounded-md border bg-muted mb-2" />
                <Button variant="secondary" onClick={() => toast("Upload (demo)")}>Upload Headshot</Button>
              </div>
              <div>
                <div className="text-sm mb-1">Brokerage Logo</div>
                <div className="h-20 rounded-md border bg-muted mb-2" />
                <Button variant="secondary" onClick={() => toast("Upload (demo)")}>Upload Logo</Button>
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
              <Button variant="secondary" onClick={() => toast("Saved (demo)")}>Save Keys</Button>
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
