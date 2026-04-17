import { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import LegalPageTemplate, { type LegalSection } from "@/components/legal-page-template";
import { generateBreadcrumbSchema, generateWebPageSchema } from "@/lib/structured-data";
import { siteConfig } from "@/lib/site-config";
import { getResolvedPublicSiteSettings } from "@/lib/public-site-settings";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms of Service for ${siteConfig.businessName} - Terms and conditions for using our services.`,
  alternates: {
    canonical: "/terms",
  },
};

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bathalaenterprises.com";

const termsSections: LegalSection[] = [
  {
    id: "acceptance-of-terms",
    title: "Acceptance of Terms",
    paragraphs: [
      "By accessing and using the Bathala Enterprises website and services, you agree to these Terms of Service. If you do not agree, please discontinue use of our services.",
    ],
  },
  {
    id: "services-description",
    title: "Services Description",
    intro: "Bathala Enterprises provides real estate services, which may include:",
    bullets: [
      "Property listing and management",
      "Real estate advisory and consultation",
      "Property valuation support",
      "Tenant relations and occupancy support",
      "Security and maintenance coordination",
    ],
  },
  {
    id: "user-responsibilities",
    title: "User Responsibilities",
    intro: "When using our website or services, you agree to:",
    bullets: [
      "Provide complete and accurate information",
      "Use services only for lawful and legitimate purposes",
      "Avoid misrepresentation of identity, ownership, or intent",
      "Comply with all applicable laws and regulations",
    ],
  },
  {
    id: "property-listings",
    title: "Property Listings",
    paragraphs: [
      "Property content is provided for informational purposes. While we make best efforts to keep information accurate, availability, pricing, and specifications may change without notice.",
    ],
  },
  {
    id: "limitation-of-liability",
    title: "Limitation of Liability",
    paragraphs: [
      "Bathala Enterprises is not liable for indirect, incidental, special, consequential, or punitive damages arising from use of our website or services. Where applicable, total liability is limited to fees paid for the specific service in question.",
    ],
  },
  {
    id: "intellectual-property",
    title: "Intellectual Property",
    paragraphs: [
      "All website content, including text, design, media, and branding, is owned by Bathala Enterprises or its licensors and is protected by applicable intellectual property laws. Unauthorized use is prohibited.",
    ],
  },
  {
    id: "changes-to-terms",
    title: "Changes to Terms",
    paragraphs: [
      "We may update these terms periodically. Revisions become effective when posted on this page. Continued use of our services after updates indicates acceptance of the revised terms.",
    ],
  },
  {
    id: "contact-information",
    title: "Contact Information",
    paragraphs: [
      "For any questions regarding these Terms of Service, please contact us using the details on this page.",
    ],
  },
];

export default async function TermsPage() {
  const settings = await getResolvedPublicSiteSettings();
  const webPageSchema = generateWebPageSchema(
    `${baseUrl}/terms`,
    "Terms of Service | Bathala Enterprises",
    `Terms of Service for ${siteConfig.businessName} - Terms and conditions for using our services.`
  );

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: baseUrl },
    { name: "Terms of Service", url: `${baseUrl}/terms` },
  ]);

  return (
    <>
      <JsonLd data={webPageSchema} />
      <JsonLd data={breadcrumbSchema} />
      <LegalPageTemplate
        title="Terms of"
        accent="Service"
        intro="These terms describe how our services may be used, what responsibilities apply, and the conditions that govern your relationship with Bathala Enterprises."
        lastUpdated="January 2026"
        sections={termsSections}
        contactTitle="Questions about terms?"
        contactIntro="Reach our team for clarification before proceeding with any service engagement."
        contactEmail={settings.legalEmail}
        phone={settings.phoneDisplay}
        address={settings.address.full}
      />
    </>
  );
}
