import { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import LegalPageTemplate, { type LegalSection } from "@/components/legal-page-template";
import { generateBreadcrumbSchema, generateWebPageSchema } from "@/lib/structured-data";
import { siteConfig } from "@/lib/site-config";
import { getResolvedPublicSiteSettings } from "@/lib/public-site-settings";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy Policy for ${siteConfig.businessName} - How we collect, use, and protect your personal information.`,
  alternates: {
    canonical: "/privacy",
  },
};

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bathalaenterprises.com";

const privacySections: LegalSection[] = [
  {
    id: "information-we-collect",
    title: "Information We Collect",
    intro:
      "We collect information you provide directly to us when you submit an inquiry, request property details, ask for services, or communicate with our team.",
    bullets: [
      "Your name and contact details, including email address and phone number",
      "Property preferences, budgets, and related requirements",
      "Communication history and inquiry context",
      "Any additional details you choose to share with us",
    ],
  },
  {
    id: "how-we-use-your-information",
    title: "How We Use Your Information",
    intro: "We use your information to provide a reliable and responsive real estate experience.",
    bullets: [
      "Respond to your inquiries and provide customer support",
      "Share listings or service details you request",
      "Improve our website, property discovery experience, and service quality",
      "Meet legal, compliance, and record-keeping obligations",
    ],
  },
  {
    id: "information-sharing",
    title: "Information Sharing",
    paragraphs: [
      "We do not sell, trade, or rent your personal information. We only share information where required to deliver our services, comply with law, or with your explicit consent.",
    ],
  },
  {
    id: "data-security",
    title: "Data Security",
    paragraphs: [
      "We apply reasonable administrative and technical safeguards to protect personal information from unauthorized access, alteration, disclosure, or destruction. No internet transmission or storage method can be guaranteed as completely secure.",
    ],
  },
  {
    id: "your-rights",
    title: "Your Rights",
    intro: "Depending on applicable law, you may request to:",
    bullets: [
      "Access the personal information we hold about you",
      "Correct inaccurate or incomplete information",
      "Request deletion of your information where applicable",
      "Opt out of non-essential marketing communications",
    ],
  },
  {
    id: "contact-us",
    title: "Contact Us",
    paragraphs: [
      "If you have questions about this Privacy Policy or how your data is handled, please contact us using the details on this page.",
    ],
  },
];

export default async function PrivacyPage() {
  const settings = await getResolvedPublicSiteSettings();
  const webPageSchema = generateWebPageSchema(
    `${baseUrl}/privacy`,
    "Privacy Policy | Bathala Enterprises",
    `Privacy Policy for ${siteConfig.businessName} - How we collect, use, and protect your personal information.`
  );

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: baseUrl },
    { name: "Privacy Policy", url: `${baseUrl}/privacy` },
  ]);

  return (
    <>
      <JsonLd data={webPageSchema} />
      <JsonLd data={breadcrumbSchema} />
      <LegalPageTemplate
        title="Privacy"
        accent="Policy"
        intro="Your trust matters. This policy explains what information we collect, how we use it, and the controls you have when using Bathala Enterprises services."
        lastUpdated="January 2026"
        sections={privacySections}
        contactTitle="Need privacy support?"
        contactIntro="Our team will help clarify any data-related request or concern."
        contactEmail={settings.email}
        phone={settings.phoneDisplay}
        address={settings.address.full}
      />
    </>
  );
}
