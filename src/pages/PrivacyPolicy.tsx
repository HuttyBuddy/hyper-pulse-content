import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicy() {
  return (
    <AppLayout
      title="Privacy Policy — Hyper-Local Pulse"
      description="Privacy policy for Hyper-Local Pulse real estate marketing platform. Learn how we collect, use, and protect your personal information."
      canonical="/privacy"
    >
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center">Privacy Policy</CardTitle>
              <p className="text-center text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none dark:prose-invert">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
                <p className="mb-4">
                  We collect information you provide directly to us, such as when you create an account, 
                  use our services, or contact us for support.
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Account information (name, email address, profile details)</li>
                  <li>Content you create using our platform</li>
                  <li>Usage data and analytics</li>
                  <li>Communication preferences</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
                <p className="mb-4">We use the information we collect to:</p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Provide and improve our real estate marketing services</li>
                  <li>Generate personalized content recommendations</li>
                  <li>Send you updates and marketing communications</li>
                  <li>Analyze usage patterns to enhance user experience</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Information Sharing</h2>
                <p className="mb-4">
                  We do not sell, trade, or rent your personal information to third parties. 
                  We may share your information in the following circumstances:
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li>With your consent</li>
                  <li>To comply with legal obligations</li>
                  <li>With service providers who help us operate our platform</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
                <p className="mb-4">
                  We implement appropriate security measures to protect your personal information 
                  against unauthorized access, alteration, disclosure, or destruction.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
                <p className="mb-4">You have the right to:</p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate information</li>
                  <li>Delete your account and personal data</li>
                  <li>Opt out of marketing communications</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
                <p className="mb-4">
                  If you have any questions about this Privacy Policy, please contact us at:{" "}
                  <a href="mailto:privacy@hyper-local-pulse.com" className="text-primary hover:underline">
                    privacy@hyper-local-pulse.com
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