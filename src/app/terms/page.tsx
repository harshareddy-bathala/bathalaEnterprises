import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for Bathala Enterprises - Terms and conditions for using our services.",
};

export default function TermsPage() {
  return (
    <div className="container-wide py-12 space-y-8">
      <header className="space-y-4">
        <h1 className="text-4xl font-black text-slate-900">Terms of Service</h1>
        <p className="text-slateInk">Last updated: January 2026</p>
      </header>

      <div className="prose prose-slate max-w-none space-y-6">
        <section className="glass-panel rounded-2xl p-6 space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">1. Acceptance of Terms</h2>
          <p className="text-slateInk">
            By accessing and using the Bathala Enterprises website and services, you accept and agree 
            to be bound by these Terms of Service. If you do not agree to these terms, please do not 
            use our services.
          </p>
        </section>

        <section className="glass-panel rounded-2xl p-6 space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">2. Services Description</h2>
          <p className="text-slateInk">
            Bathala Enterprises provides real estate services including but not limited to:
          </p>
          <ul className="list-disc list-inside text-slateInk space-y-2">
            <li>Property listing and management</li>
            <li>Real estate advisory and consultation</li>
            <li>Property valuation services</li>
            <li>Tenant relations and management</li>
            <li>Security and maintenance services</li>
          </ul>
        </section>

        <section className="glass-panel rounded-2xl p-6 space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">3. User Responsibilities</h2>
          <p className="text-slateInk">When using our services, you agree to:</p>
          <ul className="list-disc list-inside text-slateInk space-y-2">
            <li>Provide accurate and complete information</li>
            <li>Use the services for lawful purposes only</li>
            <li>Not misrepresent your identity or property ownership</li>
            <li>Comply with all applicable laws and regulations</li>
          </ul>
        </section>

        <section className="glass-panel rounded-2xl p-6 space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">4. Property Listings</h2>
          <p className="text-slateInk">
            All property information on our website is provided for informational purposes only. 
            While we strive for accuracy, we cannot guarantee that all information is current or 
            complete. Property availability, prices, and features are subject to change without notice.
          </p>
        </section>

        <section className="glass-panel rounded-2xl p-6 space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">5. Limitation of Liability</h2>
          <p className="text-slateInk">
            Bathala Enterprises shall not be liable for any indirect, incidental, special, 
            consequential, or punitive damages arising from your use of our services. Our total 
            liability shall not exceed the amount paid by you for the specific service in question.
          </p>
        </section>

        <section className="glass-panel rounded-2xl p-6 space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">6. Intellectual Property</h2>
          <p className="text-slateInk">
            All content on this website, including text, images, logos, and design elements, is 
            the property of Bathala Enterprises and is protected by intellectual property laws. 
            Unauthorized use is prohibited.
          </p>
        </section>

        <section className="glass-panel rounded-2xl p-6 space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">7. Changes to Terms</h2>
          <p className="text-slateInk">
            We reserve the right to modify these terms at any time. Changes will be effective 
            immediately upon posting on this page. Your continued use of our services after 
            changes are posted constitutes acceptance of the modified terms.
          </p>
        </section>

        <section className="glass-panel rounded-2xl p-6 space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">8. Contact Information</h2>
          <p className="text-slateInk">
            For questions about these Terms of Service, please contact us at:
          </p>
          <p className="text-slateInk">
            <strong>Email:</strong> legal@bathalaenterprises.com<br />
            <strong>Phone:</strong> +91 98765 43210<br />
            <strong>Address:</strong> Chikkapatre Main Road, 5th Cross, Basapura, Bangalore 560100
          </p>
        </section>
      </div>
    </div>
  );
}
