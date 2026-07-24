/**
 * Security utilities for input sanitization and validation
 */

/**
 * HTML entities map for escaping
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Dangerous patterns to remove from user input
 */
const DANGEROUS_PATTERNS = [
  /javascript\s*:/gi,
  /data\s*:/gi,
  /vbscript\s*:/gi,
  /on\w+\s*=/gi,
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^>]*>/gi,
  /<link\b[^>]*>/gi,
  /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
  /expression\s*\(/gi,
  /url\s*\(/gi,
  /@import/gi,
];

/**
 * Sanitize a string by removing potentially dangerous characters and patterns
 */
export function sanitizeString(input: string, maxLength: number = 5000): string {
  if (!input || typeof input !== 'string') return '';
  
  let sanitized = input.trim();
  
  // Remove dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }
  
  // Escape HTML entities
  sanitized = sanitized.replace(/[&<>"'`=\/]/g, (char) => HTML_ENTITIES[char] || char);
  
  // Limit length
  return sanitized.substring(0, maxLength);
}

/**
 * Sanitize string without HTML encoding (for display in controlled contexts)
 */
export function sanitizeText(input: string, maxLength: number = 5000): string {
  if (!input || typeof input !== 'string') return '';
  
  let sanitized = input.trim();
  
  // Remove angle brackets and dangerous patterns
  sanitized = sanitized.replace(/[<>]/g, '');
  
  // Remove dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }
  
  return sanitized.substring(0, maxLength);
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';
  
  return email
    .trim()
    .toLowerCase()
    .replace(/[<>'"]/g, '') // Remove potential XSS chars
    .substring(0, 254); // Max email length per RFC 5321
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }
    // Prevent data: and javascript: in URL components
    if (parsed.href.toLowerCase().includes('javascript:') || 
        parsed.href.toLowerCase().includes('data:')) {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
}

/**
 * Validate phone number format (Indian)
 */
function normalizePhoneInput(phone: string): string {
  return phone.trim().replace(/[\s().-]/g, '');
}

export function normalizeIndianPhone(phone: string): string | null {
  if (!phone || typeof phone !== 'string') {
    return null;
  }

  const normalized = normalizePhoneInput(phone);
  if (!normalized) {
    return null;
  }

  const hasPlusPrefix = normalized.startsWith('+');
  const digitsOnly = hasPlusPrefix ? normalized.slice(1) : normalized;

  if (!/^\d+$/.test(digitsOnly)) {
    return null;
  }

  const toCanonical = (localNumber: string): string | null => {
    if (!/^[6-9]\d{9}$/.test(localNumber)) {
      return null;
    }

    return `+91${localNumber}`;
  };

  if (digitsOnly.length === 10) {
    return toCanonical(digitsOnly);
  }

  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    return toCanonical(digitsOnly.slice(1));
  }

  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return toCanonical(digitsOnly.slice(2));
  }

  return null;
}

export function isValidIndianPhone(phone: string): boolean {
  return normalizeIndianPhone(phone) !== null;
}

/**
 * Rate limiting helper for client-side
 */
const requestTimestamps = new Map<string, number[]>();
const CLIENT_RATE_LIMIT_MAX_KEYS = 300;

function normalizeRateLimitKey(key: string): string {
  const normalized = key.trim().toLowerCase().slice(0, 120);
  return normalized.length > 0 ? normalized : "anonymous";
}

function pruneRateLimitStore(now: number, windowMs: number): void {
  for (const [storedKey, timestamps] of requestTimestamps.entries()) {
    const valid = timestamps.filter((ts) => now - ts < windowMs);
    if (valid.length === 0) {
      requestTimestamps.delete(storedKey);
      continue;
    }

    requestTimestamps.set(storedKey, valid);
  }
}

export function checkRateLimit(key: string, maxRequests: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const normalizedKey = normalizeRateLimitKey(key);

  if (requestTimestamps.size > CLIENT_RATE_LIMIT_MAX_KEYS) {
    pruneRateLimitStore(now, windowMs);
  }

  const timestamps = requestTimestamps.get(normalizedKey) || [];
  
  // Remove old timestamps
  const validTimestamps = timestamps.filter(ts => now - ts < windowMs);
  
  if (validTimestamps.length >= maxRequests) {
    return false; // Rate limited
  }
  
  validTimestamps.push(now);
  requestTimestamps.set(normalizedKey, validTimestamps);
  return true;
}

/**
 * Escape HTML entities (for safe display)
 */
export function escapeHtml(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/[&<>"'`=\/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Generate a CSRF token (for additional protection in forms)
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    globalThis.crypto.getRandomValues(array);
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate that a string contains only alphanumeric characters
 */
export function isAlphanumeric(str: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(str);
}

/**
 * Validate UUID format
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}
