/**
 * Site Configuration
 * 
 * Update these values with your actual business information before deploying to production.
 * These values are used throughout the site for contact information, business details, etc.
 */

export const siteConfig = {
  // Business Information
  businessName: "Bathala Enterprises",
  tagline: "Building trust, one property at a time.",
  
  // Contact Information - UPDATE THESE FOR PRODUCTION
  contact: {
    phone: "+91 98765 43210",
    phoneDisplay: "+91 98765 43210",
    email: "info@bathalaenterprises.com",
    legalEmail: "legal@bathalaenterprises.com",
  },
  
  // Address - UPDATE FOR PRODUCTION
  address: {
    street: "Chikkapatre Main Road, 5th Cross",
    area: "Basapura",
    city: "Bangalore",
    state: "Karnataka",
    pincode: "560100",
    country: "India",
    full: "Chikkapatre Main Road, 5th Cross, Basapura, Bangalore 560100",
  },
  
  // Business Hours
  hours: {
    weekdays: "Mon - Sat: 9:00 AM - 7:00 PM",
    sunday: "Closed",
  },
  
  // Social Media - UPDATE FOR PRODUCTION (set to null if not applicable)
  social: {
    facebook: null,
    twitter: null,
    instagram: null,
    linkedin: null,
  },
  
  // Map embed URL for contact page
  mapEmbedUrl: "https://maps.google.com/maps?q=basapura,bangalore&t=&z=15&ie=UTF8&iwloc=&output=embed",
} as const;

export type SiteConfig = typeof siteConfig;
