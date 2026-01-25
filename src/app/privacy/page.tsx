import { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy Policy for ${siteConfig.businessName} - How we collect, use, and protect your personal information.`,
};

export default function PrivacyPage() {
  return (
    <div className="container-wide py-12 space-y-8">
      <header className="space-y-4">
        <h1 className="text-4xl font-black text-slate-900">Privacy Policy</h1>
        <p className="text-slateInk">Last updated: January 2026</p>
      </header>

      <div className="prose prose-slate max-w-none space-y-6">
        <section className="glass-panel rounded-2xl p-6 space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">1. Information We Collect</h2>
          <p className="text-slateInk">
            We collect information you provide directly to us, such as when you fill out a contact form, 
            request information about properties or services, or communicate with us. This may include:
          </p>
          <ul className="list-disc list-inside text-slateInk space-y-2">
            <li>Name and contact information (email address, phone number)</li>
            <li>Property preferences and requirements</li>
            <li>Communication history with our team</li>
            <li>Any other information you choose to provide</li>
          </ul>
        </section>

        <section className="glass-panel rounded-2xl p-6 space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">2. How We Use Your Information</h2>
          <p className="text-slateInk">We use the information we collect to:</p>
          <ul className="list-disc list-inside text-slateInk space-y-2">
            <li>Respond to your inquiries and provide customer service</li>
            <li>Send you property listings and service information you've requested</li>
            <li>Improve our website and services</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="glass-panel rounded-2xl p-6 space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">3. Information Sharing</h2>
          <p className="text-slateInk">
            We do not sell, trade, or otherwise transfer your personal information to third parties 
            without your consent, except as necessary to provide our services or as required by law.
          </p>
        </section>

        <section className="glass-panel rounded-2xl p-6 space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">4. Data Security</h2>
          <p className="text-slateInk">
            We implement appropriate security measures to protect your personal information against 
            unauthorized access, alteration, disclosure, or destruction. However, no method of 
            transmission over the Internet is 100% secure.
          </p>
        </section>

        <section className="glass-panel rounded-2xl p-6 space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">5. Your Rights</h2>
          <p className="text-slateInk">You have the right to:</p>
          <ul className="list-disc list-inside text-slateInk space-y-2">
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your personal information</li>
            <li>Opt out of marketing communications</li>
          </ul>
        </section>

        <section className="glass-panel rounded-2xl p-6 space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">6. Contact Us</h2>
          <p className="text-slateInk">
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <p className="text-slateInk">
            <strong>Email:</strong> {siteConfig.contact.email}<br />
            <strong>Phone:</strong> {siteConfig.contact.phoneDisplay}<br />
            <strong>Address:</strong> {siteConfig.address.full}
          </p>
        </section>
      </div>
    </div>
  );
}
