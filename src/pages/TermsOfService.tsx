import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsOfService() {
  return (
    <AppLayout
      title="Terms of Service — Hyper-Local Pulse"
      description="Terms of service for Hyper-Local Pulse real estate marketing platform. Review our terms and conditions for using our services."
      canonical="/terms"
    >
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center">Terms of Service</CardTitle>
              <p className="text-center text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none dark:prose-invert">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Acceptance of Terms</h2>
                <p className="mb-4">
                  By accessing and using Hyper-Local Pulse, you accept and agree to be bound by the terms 
                  and provision of this agreement.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Use License</h2>
                <p className="mb-4">
                  Permission is granted to temporarily use Hyper-Local Pulse for personal, 
                  non-commercial transitory viewing only.
                </p>
                <p className="mb-4">Under this license you may not:</p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Modify or copy the materials</li>
                  <li>Use the materials for any commercial purpose</li>
                  <li>Attempt to reverse engineer any software</li>
                  <li>Remove any copyright or proprietary notations</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">User Accounts</h2>
                <p className="mb-4">
                  When you create an account with us, you must provide information that is accurate, 
                  complete, and current at all times.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Content</h2>
                <p className="mb-4">
                  Our service allows you to create, upload, and share content. You retain ownership 
                  of any intellectual property rights that you hold in that content.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Prohibited Uses</h2>
                <p className="mb-4">You may not use our service:</p>
                <ul className="list-disc pl-6 mb-4">
                  <li>For any unlawful purpose</li>
                  <li>To transmit viruses or malicious code</li>
                  <li>To harass or harm others</li>
                  <li>To violate any applicable laws or regulations</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Termination</h2>
                <p className="mb-4">
                  We may terminate or suspend your account immediately, without prior notice, 
                  for conduct that we believe violates these Terms of Service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
                <p className="mb-4">
                  Questions about the Terms of Service should be sent to us at:{" "}
                  <a href="mailto:legal@hyper-local-pulse.com" className="text-primary hover:underline">
                    legal@hyper-local-pulse.com
                  </a>
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </main>
    </AppLayout>
  );
}