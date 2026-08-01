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
    phone: "+91 97410 00396",
    phoneDisplay: "+91 97410 00396",
    email: "bathalaenterprises@gmail.com",
    legalEmail: "bathalaenterprises@gmail.com",
  },
  
  // Address - UPDATE FOR PRODUCTION
  address: {
    street: "VJ2X+PV3, Green House Layout",
    area: "Chikkathoguru, Electronic City",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560100",
    country: "India",
    full: "BATHALA ENTERPRISES VJ2X+PV3, Green House Layout, Chikkathoguru, Electronic City, Bengaluru, Karnataka 560100",
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
  mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d3889.8678967463497!2d77.6471197!3d12.8518078!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae6dba0005a597%3A0x969fb3e583ff1adb!2sBathala%20Enterprises!5e0!3m2!1sen!2sin!4v1769447957833!5m2!1sen!2sin",
} as const;

export type SiteConfig = typeof siteConfig;
