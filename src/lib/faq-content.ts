/**
 * Canonical FAQ content.
 *
 * Single source for three consumers, so they can never drift apart:
 *   1. `FAQPage` JSON-LD on /about and /contact (rich results, AI answer engines)
 *   2. The Gemini chatbot's grounding context (src/app/api/chat/route.ts)
 *   3. `/llms.txt`
 *
 * ⚠️  REVIEW BEFORE LAUNCH. These answers were drafted from what the site
 * already states (service types, service area, contact channels) and are
 * deliberately free of specific numbers, prices and timelines. Replace them
 * with the business's own wording. Anything asserted here is presented to
 * Google as a factual claim about the business.
 */

export type FaqEntry = {
  question: string;
  answer: string;
};

export const FAQ_ENTRIES: readonly FaqEntry[] = [
  {
    question: "Which areas of Bengaluru does Bathala Enterprises cover?",
    answer:
      "We focus on Electronic City and the surrounding micro-markets in south Bengaluru, including Chikkathoguru and the neighbouring layouts. Get in touch if you are looking in an adjacent area and we will tell you whether we can help.",
  },
  {
    question: "What types of property can I find through Bathala Enterprises?",
    answer:
      "Our listings cover properties for rent, for lease and for sale. Each listing shows the location, configuration, built-up area and current price, and you can filter the full catalogue by type on our properties page.",
  },
  {
    question: "What services does Bathala Enterprises offer besides listings?",
    answer:
      "Alongside helping you find a property, we offer property management, leasing support, maintenance coordination and advisory. Our services page lists the current catalogue with what each one covers.",
  },
  {
    question: "How do I arrange a site visit or ask about a specific property?",
    answer:
      "Use the enquiry form on any property page, or contact us directly by phone or email. Tell us which listing you are interested in and what timings suit you, and we will arrange the visit.",
  },
  {
    question: "Is there a fee for enquiring about a property?",
    answer:
      "No. Enquiring, asking questions and arranging a viewing cost nothing. Any charges that apply to a specific service are discussed and agreed with you before work begins.",
  },
  {
    question: "How current are the listings on the site?",
    answer:
      "Listings are maintained directly by our team and the website refreshes them continuously, so what you see reflects current availability. If a listing has just been taken, we will tell you and suggest comparable options.",
  },
] as const;

/** Compact plain-text rendering for the chatbot prompt and /llms.txt. */
export function faqAsText(): string {
  return FAQ_ENTRIES.map((entry) => `Q: ${entry.question}\nA: ${entry.answer}`).join("\n\n");
}
