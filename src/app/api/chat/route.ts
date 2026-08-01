import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { apiError, apiSuccess, createRequestId, zodIssuesToFieldErrors } from "@/lib/api-response";
import {
  isTransientNetworkError,
  retryWithExponentialBackoff,
  TimeoutError,
  withTimeout,
} from "@/lib/async-utils";
import { reportError } from "@/lib/monitoring";
import { checkRateLimit as checkServerRateLimit } from "@/lib/rate-limit";
import { getPropertiesFromSupabase, getServicesFromSupabase } from "@/lib/supabase-queries";
import {
  FALLBACK_PUBLIC_SITE_SETTINGS,
  getResolvedPublicSiteSettings,
  type ResolvedPublicSiteSettings,
} from "@/lib/public-site-settings";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

function readPositiveIntEnv(rawValue: string | undefined, fallback: number): number {
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

const CHAT_RATE_LIMIT_MAX = readPositiveIntEnv(process.env.CHAT_RATE_LIMIT_MAX, 40);
const CHAT_RATE_LIMIT_WINDOW_MS = readPositiveIntEnv(process.env.CHAT_RATE_LIMIT_WINDOW_MS, 60_000);
const CHAT_CLIENT_ID_HEADER = "x-chat-client-id";
const CHAT_CLIENT_ID_PATTERN = /^[a-zA-Z0-9_-]{8,128}$/;
const REQUEST_BODY_TIMEOUT_MS = 7_000;
const CONTEXT_BUILD_TIMEOUT_MS = 9_000;
const MODEL_RESPONSE_TIMEOUT_MS = 9_000;
const MAX_PROPERTY_MATCHES = 8;
const MAX_SERVICE_MATCHES = 8;
const MAX_PROPERTY_LIST_RESPONSE = 24;
const MAX_SERVICE_LIST_RESPONSE = 16;
const DEFAULT_FALLBACK_PROPERTY_COUNT = 3;
const DEFAULT_FALLBACK_SERVICE_COUNT = 3;

const chatRequestSchema = z.object({
  message: z.string().trim().min(1, "Message is required.").max(1000, "Message is too long."),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "bot", "assistant"]),
        content: z.string().max(2000, "History entry is too long."),
      })
    )
    .default([]),
});

type ChatPayload = z.infer<typeof chatRequestSchema>;
type ChatHistoryEntry = ChatPayload["history"][number];
type ChatProperty = Awaited<ReturnType<typeof getPropertiesFromSupabase>>[number];
type ChatService = Awaited<ReturnType<typeof getServicesFromSupabase>>[number];

type CatalogSnapshot = {
  properties: ChatProperty[];
  services: ChatService[];
  summary: string;
};

let cachedCatalog: CatalogSnapshot | null = null;
let cacheTime = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000;
let modelProviderBackoffUntil = 0;
let lastRetryableModelErrorReportAt = 0;
const MODEL_PROVIDER_MIN_BACKOFF_MS = 15_000;
const MODEL_PROVIDER_MAX_BACKOFF_MS = 15 * 60 * 1000;
const MODEL_PROVIDER_HARD_QUOTA_BACKOFF_MS = 30 * 60 * 1000;
const RETRYABLE_MODEL_ERROR_REPORT_INTERVAL_MS = 5 * 60 * 1000;

const SYSTEM_PROMPT = `You are Bathala AI, the helpful assistant for Bathala Enterprises, a premium real estate company in Bangalore, India.

Your role:
1. Answer questions about properties, services, locations, and pricing using provided database context
2. Help users find suitable properties based on user constraints
3. Suggest best-fit options with clear reasons and factual details
4. Be friendly, professional, concise, and practical

Guidelines:
- Always respond in a conversational, helpful manner
- Use only facts from the provided context sections (catalog summary and retrieval results)
- For recommendations, provide up to 3 best options with title, location, type, and price
- If data is unavailable, clearly say it is not in the current database
- Keep responses concise but informative (typically 3-8 sentences)
- Use INR/₹ format suitable for India

Important:
- Never make up property/service details, IDs, locations, prices, or availability
- If no properties match a query, suggest broadening filters or contacting us
- For complex inquiries, recommend filling out the contact form`;

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "at",
  "be",
  "for",
  "from",
  "how",
  "i",
  "in",
  "is",
  "it",
  "me",
  "my",
  "of",
  "on",
  "or",
  "show",
  "tell",
  "the",
  "to",
  "us",
  "what",
  "which",
  "with",
]);

function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function getClientIp(request: NextRequest): string {
  const cloudflareIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cloudflareIp) {
    return cloudflareIp;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  const forwardedIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwardedIp) {
    return forwardedIp;
  }

  return "unknown";
}

function buildChatRateLimitKey(request: NextRequest): string | null {
  const ip = getClientIp(request);
  const userAgent = (request.headers.get("user-agent") || "unknown-agent").slice(0, 80);
  const rawClientId = request.headers.get(CHAT_CLIENT_ID_HEADER)?.trim() || "";
  const clientId = CHAT_CLIENT_ID_PATTERN.test(rawClientId) ? rawClientId : "";

  if (clientId) {
    return ip === "unknown" ? `anon:${clientId}` : `${ip}:${clientId}`;
  }

  if (ip === "unknown") {
    return null;
  }

  return `${ip}:${userAgent}`;
}

function trimForContext(input: string, maxLength: number): string {
  const normalized = normalizeWhitespace(input);
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

function formatPropertyPrice(property: ChatProperty): string {
  const amount = `INR ${property.price.toLocaleString("en-IN")}`;
  if (property.type === "Sale") {
    return amount;
  }
  if (property.type === "Lease") {
    return `${amount}/year`;
  }
  return `${amount}/month`;
}

function tokenizeQuery(query: string): string[] {
  return normalizeWhitespace(query)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function detectRequestedPropertyType(query: string): ChatProperty["type"] | null {
  if (/\brent\b|\brental\b/.test(query)) {
    return "Rent";
  }
  if (/\blease\b|\bleasing\b/.test(query)) {
    return "Lease";
  }
  if (/\bsale\b|\bbuy\b|\bpurchase\b/.test(query)) {
    return "Sale";
  }

  return null;
}

function extractBedroomCount(query: string): number | null {
  const match = query.match(/(\d+)\s*(?:bhk|bed|beds|bedroom|bedrooms)/i);
  if (!match) {
    return null;
  }

  const count = Number.parseInt(match[1], 10);
  return Number.isFinite(count) ? count : null;
}

function toNumericIndianAmount(rawAmount: string, rawUnit?: string): number | null {
  const amount = Number.parseFloat(rawAmount.replace(/,/g, ""));
  if (!Number.isFinite(amount)) {
    return null;
  }

  if (!rawUnit) {
    return amount;
  }

  const unit = rawUnit.toLowerCase();
  if (["cr", "crore", "crores"].includes(unit)) {
    return amount * 10_000_000;
  }
  if (["l", "lac", "lakh", "lakhs"].includes(unit)) {
    return amount * 100_000;
  }
  if (["k", "thousand"].includes(unit)) {
    return amount * 1_000;
  }

  return amount;
}

function extractUpperBudget(query: string): number | null {
  const budgetMatch = query.match(
    /(?:under|below|less than|max(?:imum)?|upto|up to)\s*(?:₹|rs\.?|inr)?\s*([\d,.]+)\s*(cr|crore|crores|l|lac|lakh|lakhs|k|thousand)?/i
  );

  if (!budgetMatch) {
    return null;
  }

  return toNumericIndianAmount(budgetMatch[1], budgetMatch[2]);
}

function buildPropertySearchText(property: ChatProperty): string {
  const amenities = Array.isArray(property.amenities) ? property.amenities.join(" ") : "";
  return normalizeWhitespace(
    `${property.title} ${property.location} ${property.type} ${property.description || ""} ${amenities} ${property.bedrooms} bhk ${property.sqft} sqft ${property.price}`
  ).toLowerCase();
}

function scorePropertyMatch(
  property: ChatProperty,
  query: string,
  tokens: string[],
  requestedType: ChatProperty["type"] | null,
  requestedBedrooms: number | null,
  requestedBudgetUpper: number | null
): number {
  const text = buildPropertySearchText(property);
  let score = 0;

  for (const token of tokens) {
    if (text.includes(token)) {
      score += token.length >= 5 ? 2 : 1;
    }
  }

  if (requestedType) {
    score += property.type === requestedType ? 4 : -2;
  }

  if (requestedBedrooms !== null) {
    if (property.bedrooms === requestedBedrooms) {
      score += 5;
    } else if (Math.abs(property.bedrooms - requestedBedrooms) === 1) {
      score += 2;
    } else {
      score -= 1;
    }
  }

  if (requestedBudgetUpper !== null) {
    score += property.price <= requestedBudgetUpper ? 4 : -2;
  }

  if (/\b(location|area|locality|near)\b/.test(query)) {
    const location = property.location.toLowerCase();
    if (tokens.some((token) => location.includes(token))) {
      score += 3;
    }
  }

  if (/\b(price|cost|budget|rent|lease|sale)\b/.test(query)) {
    score += 1;
  }

  return score;
}

function rankProperties(
  query: string,
  properties: ChatProperty[],
  limit: number,
  forceList: boolean
): ChatProperty[] {
  if (properties.length === 0) {
    return [];
  }

  if (forceList) {
    return properties.slice(0, limit);
  }

  const normalizedQuery = query.toLowerCase();
  const tokens = tokenizeQuery(query);
  const requestedType = detectRequestedPropertyType(normalizedQuery);
  const requestedBedrooms = extractBedroomCount(normalizedQuery);
  const requestedBudgetUpper = extractUpperBudget(normalizedQuery);

  const scored = properties
    .map((property) => ({
      property,
      score: scorePropertyMatch(
        property,
        normalizedQuery,
        tokens,
        requestedType,
        requestedBedrooms,
        requestedBudgetUpper
      ),
    }))
    .filter((entry) => entry.score > 0);

  if (scored.length === 0) {
    const fallback = requestedType
      ? properties.filter((property) => property.type === requestedType)
      : properties;
    return fallback.slice(0, limit);
  }

  scored.sort((a, b) => b.score - a.score || a.property.price - b.property.price);
  return scored.slice(0, limit).map((entry) => entry.property);
}

function buildServiceSearchText(service: ChatService): string {
  return normalizeWhitespace(
    `${service.title} ${service.card_description || ""} ${service.detailed_description || ""} ${service.price_range || ""}`
  ).toLowerCase();
}

function scoreServiceMatch(service: ChatService, query: string, tokens: string[]): number {
  const text = buildServiceSearchText(service);
  let score = 0;

  for (const token of tokens) {
    if (text.includes(token)) {
      score += token.length >= 5 ? 2 : 1;
    }
  }

  if (/\b(service|services|maintenance|support|management|legal|documentation|security)\b/.test(query)) {
    score += 1;
  }

  return score;
}

function rankServices(
  query: string,
  services: ChatService[],
  limit: number,
  forceList: boolean
): ChatService[] {
  if (services.length === 0) {
    return [];
  }

  if (forceList) {
    return services.slice(0, limit);
  }

  const normalizedQuery = query.toLowerCase();
  const tokens = tokenizeQuery(query);

  const scored = services
    .map((service) => ({
      service,
      score: scoreServiceMatch(service, normalizedQuery, tokens),
    }))
    .filter((entry) => entry.score > 0);

  if (scored.length === 0) {
    return services.slice(0, Math.min(limit, 4));
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((entry) => entry.service);
}

function buildCatalogSummary(
  properties: ChatProperty[],
  services: ChatService[],
  settings: ResolvedPublicSiteSettings
): string {
  const rentCount = properties.filter((property) => property.type === "Rent").length;
  const leaseCount = properties.filter((property) => property.type === "Lease").length;
  const saleCount = properties.filter((property) => property.type === "Sale").length;

  const locationCounts = new Map<string, number>();
  for (const property of properties) {
    const locationKey = property.location.split(",")[0]?.trim() || property.location.trim();
    if (!locationKey) {
      continue;
    }
    locationCounts.set(locationKey, (locationCounts.get(locationKey) || 0) + 1);
  }

  const topLocations = Array.from(locationCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([location, count]) => `${location} (${count})`)
    .join(", ");

  // Sourced from site_settings (admin-editable) with siteConfig as fallback.
  // These were previously hardcoded placeholders — the assistant was giving
  // users a phone number, email and address that do not exist.
  return `
COMPANY INFORMATION:
- Name: ${settings.businessName}
- Phone: ${settings.phoneDisplay}
- Email: ${settings.email}
- Location: ${settings.address.full}
- Operating Hours: ${settings.hours.weekdays}; Sunday: ${settings.hours.sunday}

DATABASE SNAPSHOT:
- Total properties: ${properties.length}
- Rent listings: ${rentCount}
- Lease listings: ${leaseCount}
- Sale listings: ${saleCount}
- Total services: ${services.length}
- Key areas: ${topLocations || "No locations listed"}
`;
}

function buildRetrievedContext(
  message: string,
  history: ChatHistoryEntry[],
  catalog: CatalogSnapshot
): string {
  const priorUserContext = history
    .filter((entry) => entry.role === "user")
    .slice(-2)
    .map((entry) => entry.content)
    .join(" ");

  const combinedQuery = normalizeWhitespace(`${message} ${priorUserContext}`);
  const normalizedQuery = combinedQuery.toLowerCase();

  const asksProperties = /\b(property|properties|rent|lease|sale|apartment|villa|bhk|bedroom|sqft|location|price|budget)\b/.test(normalizedQuery);
  const asksServices = /\b(service|services|maintenance|management|security|documentation|legal|support|consult)\b/.test(normalizedQuery);
  const asksAllProperties = /\b(all properties|property list|list properties|show properties|available properties)\b/.test(normalizedQuery);
  const asksAllServices = /\b(all services|service list|list services|show services|available services)\b/.test(normalizedQuery);

  const includeProperties = asksProperties || (!asksProperties && !asksServices);
  const includeServices = asksServices || (!asksProperties && !asksServices);

  const propertyMatches = includeProperties
    ? rankProperties(
        combinedQuery,
        catalog.properties,
        asksAllProperties ? MAX_PROPERTY_LIST_RESPONSE : MAX_PROPERTY_MATCHES,
        asksAllProperties
      )
    : [];

  const serviceMatches = includeServices
    ? rankServices(
        combinedQuery,
        catalog.services,
        asksAllServices ? MAX_SERVICE_LIST_RESPONSE : MAX_SERVICE_MATCHES,
        asksAllServices
      )
    : [];

  const propertyLines = propertyMatches.length > 0
    ? propertyMatches
        .map(
          (property, index) =>
            `${index + 1}. ${property.title} | ${property.location} | ${property.type} | ${formatPropertyPrice(property)} | ${property.bedrooms} BHK | ${property.sqft} sqft | Property ID: ${property.id}`
        )
        .join("\n")
    : "No closely matching properties found for this query in the current database.";

  const serviceLines = serviceMatches.length > 0
    ? serviceMatches
        .map((service, index) => {
          const summary = trimForContext(
            service.card_description || service.detailed_description || "Service details available on request.",
            180
          );
          return `${index + 1}. ${service.title} | ${summary} | Price Range: ${service.price_range || "Contact for pricing"} | Service ID: ${service.id}`;
        })
        .join("\n")
    : "No closely matching services found for this query in the current database.";

  return `
RETRIEVAL RESULTS FOR CURRENT USER QUESTION
User question: "${trimForContext(message, 280)}"

Matched properties (${propertyMatches.length}/${catalog.properties.length} shown):
${propertyLines}

Matched services (${serviceMatches.length}/${catalog.services.length} shown):
${serviceLines}

RESPONSE RULE:
- Base the answer on the above matches and catalog summary only.
- If no exact match exists, say so clearly and suggest the closest available options.
`;
}

function toReplyPrice(priceLabel: string): string {
  return priceLabel.replace(/^INR\s+/i, "₹");
}

function buildDeterministicReply(
  message: string,
  history: ChatHistoryEntry[],
  catalog: CatalogSnapshot
): string {
  const priorUserContext = history
    .filter((entry) => entry.role === "user")
    .slice(-2)
    .map((entry) => entry.content)
    .join(" ");

  const combinedQuery = normalizeWhitespace(`${message} ${priorUserContext}`);
  const normalizedQuery = combinedQuery.toLowerCase();

  const asksProperties = /\b(property|properties|rent|lease|sale|apartment|villa|bhk|bedroom|sqft|location|price|budget)\b/.test(normalizedQuery);
  const asksServices = /\b(service|services|maintenance|management|security|documentation|legal|support|consult)\b/.test(normalizedQuery);
  const asksAllProperties = /\b(all properties|property list|list properties|show properties|available properties)\b/.test(normalizedQuery);
  const asksAllServices = /\b(all services|service list|list services|show services|available services)\b/.test(normalizedQuery);

  const propertyMatches = rankProperties(
    combinedQuery,
    catalog.properties,
    asksAllProperties ? MAX_PROPERTY_LIST_RESPONSE : DEFAULT_FALLBACK_PROPERTY_COUNT,
    asksAllProperties
  );
  const serviceMatches = rankServices(
    combinedQuery,
    catalog.services,
    asksAllServices ? MAX_SERVICE_LIST_RESPONSE : DEFAULT_FALLBACK_SERVICE_COUNT,
    asksAllServices
  );

  if (asksProperties && !asksServices) {
    if (propertyMatches.length === 0) {
      return "I could not find an exact property match in the current database. Share your preferred area, budget, and BHK, and I will suggest the closest available options.";
    }

    const propertyLines = propertyMatches
      .map(
        (property) =>
          `${property.title} in ${property.location} (${property.type}, ${property.bedrooms} BHK, ${property.sqft} sqft) at ${toReplyPrice(formatPropertyPrice(property))}`
      )
      .join("; ");

    return `Here are matching properties: ${propertyLines}. If you want, I can narrow this by exact location or budget.`;
  }

  if (asksServices && !asksProperties) {
    if (serviceMatches.length === 0) {
      return "I could not find an exact service match in the current list. Tell me what you need help with, and I will recommend the nearest relevant service.";
    }

    const serviceLines = serviceMatches
      .map((service) => {
        const summary = trimForContext(
          service.card_description || service.detailed_description || "Service details available on request.",
          110
        );
        return `${service.title} (${summary})${service.price_range ? ` - ${service.price_range}` : ""}`;
      })
      .join("; ");

    return `These services match your request: ${serviceLines}. I can also suggest which one is best based on your specific goal.`;
  }

  if (propertyMatches.length > 0 && serviceMatches.length > 0) {
    const propertyPreview = propertyMatches
      .slice(0, 2)
      .map((property) => `${property.title} (${toReplyPrice(formatPropertyPrice(property))})`)
      .join(", ");
    const servicePreview = serviceMatches
      .slice(0, 2)
      .map((service) => service.title)
      .join(", ");

    return `I can help with both listings and services. Property matches include ${propertyPreview}. Relevant services include ${servicePreview}. Tell me whether you want rental, lease, sale, or service guidance and I will refine the suggestions.`;
  }

  if (propertyMatches.length > 0) {
    const propertyPreview = propertyMatches
      .slice(0, 3)
      .map((property) => `${property.title} in ${property.location}`)
      .join(", ");

    return `I found these property options: ${propertyPreview}. Share your budget and BHK preference, and I will shortlist the best fit.`;
  }

  if (serviceMatches.length > 0) {
    const servicePreview = serviceMatches
      .slice(0, 3)
      .map((service) => service.title)
      .join(", ");

    return `Available relevant services are ${servicePreview}. Tell me your requirement and I can recommend the right one.`;
  }

  return "I can help you with properties for rent, lease, or sale, and services like management, maintenance, and documentation. Share your preferred area and budget to get tailored suggestions.";
}

function getFallbackReply(type: "busy" | "unavailable" | "validation" | "default"): string {
  if (type === "busy") {
    return "Our AI assistant is currently busy. Please try again in a few moments, or contact us directly at +91 98765 43210.";
  }

  if (type === "unavailable") {
    return "I am having trouble connecting right now. Please contact us directly at +91 98765 43210.";
  }

  if (type === "validation") {
    return "Please share a short valid question and try again.";
  }

  return "I apologize, but I encountered an error. Please try again or contact us directly at +91 98765 43210.";
}

function isRetryableModelError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error || "").toLowerCase();

  return (
    isTransientNetworkError(error) ||
    message.includes("quota") ||
    message.includes("rate limit") ||
    message.includes("too many requests") ||
    message.includes("unavailable") ||
    message.includes("deadline")
  );
}

function extractRetryDelayMs(message: string): number | null {
  const retryInfoMatch = message.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/i);
  if (retryInfoMatch) {
    const seconds = Number.parseFloat(retryInfoMatch[1]);
    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.round(seconds * 1000);
    }
  }

  const humanReadableMatch = message.match(/please retry in\s+(\d+(?:\.\d+)?)s/i);
  if (humanReadableMatch) {
    const seconds = Number.parseFloat(humanReadableMatch[1]);
    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.round(seconds * 1000);
    }
  }

  return null;
}

function registerModelProviderBackoff(error: unknown): number {
  const message = error instanceof Error ? error.message : String(error || "");
  const normalizedMessage = message.toLowerCase();
  const extractedDelayMs = extractRetryDelayMs(message);

  let backoffMs = extractedDelayMs ?? MODEL_PROVIDER_MIN_BACKOFF_MS;
  backoffMs = Math.max(MODEL_PROVIDER_MIN_BACKOFF_MS, backoffMs);
  backoffMs = Math.min(MODEL_PROVIDER_MAX_BACKOFF_MS, backoffMs);

  const isHardQuotaBlock =
    normalizedMessage.includes("quota exceeded") && normalizedMessage.includes("limit: 0");

  if (isHardQuotaBlock) {
    backoffMs = Math.max(backoffMs, MODEL_PROVIDER_HARD_QUOTA_BACKOFF_MS);
  }

  modelProviderBackoffUntil = Math.max(modelProviderBackoffUntil, Date.now() + backoffMs);
  return Math.max(0, modelProviderBackoffUntil - Date.now());
}

function getModelProviderBackoffRemainingMs(): number {
  const remainingMs = modelProviderBackoffUntil - Date.now();
  return remainingMs > 0 ? remainingMs : 0;
}

function shouldReportRetryableModelError(): boolean {
  if (process.env.NODE_ENV !== "production") {
    return false;
  }

  const now = Date.now();
  if (now - lastRetryableModelErrorReportAt < RETRYABLE_MODEL_ERROR_REPORT_INTERVAL_MS) {
    return false;
  }

  lastRetryableModelErrorReportAt = now;
  return true;
}

async function getRAGContext(requestId: string): Promise<string> {
  const now = Date.now();
  if (cachedCatalog && now - cacheTime < CACHE_DURATION_MS) {
    return cachedCatalog.summary;
  }

  const [propertiesResult, servicesResult, settingsResult] = await Promise.allSettled([
    // includeInactive: false — the assistant must not offer listings that are
    // not publicly available.
    withTimeout(getPropertiesFromSupabase(false), CONTEXT_BUILD_TIMEOUT_MS, "Fetching properties for chat context timed out."),
    withTimeout(getServicesFromSupabase(), CONTEXT_BUILD_TIMEOUT_MS, "Fetching services for chat context timed out."),
    withTimeout(getResolvedPublicSiteSettings(), CONTEXT_BUILD_TIMEOUT_MS, "Fetching site settings for chat context timed out."),
  ]);

  if (propertiesResult.status === "rejected") {
    reportError(propertiesResult.reason, {
      route: "/api/chat",
      requestId,
      stage: "load_context_properties",
    });
  }

  if (servicesResult.status === "rejected") {
    reportError(servicesResult.reason, {
      route: "/api/chat",
      requestId,
      stage: "load_context_services",
    });
  }

  if (settingsResult.status === "rejected") {
    reportError(settingsResult.reason, {
      route: "/api/chat",
      requestId,
      stage: "load_context_settings",
    });
  }

  const properties = propertiesResult.status === "fulfilled" ? propertiesResult.value : [];
  const services = servicesResult.status === "fulfilled" ? servicesResult.value : [];
  const settings =
    settingsResult.status === "fulfilled" ? settingsResult.value : FALLBACK_PUBLIC_SITE_SETTINGS;

  cachedCatalog = {
    properties,
    services,
    summary: buildCatalogSummary(properties, services, settings),
  };

  cacheTime = now;
  return cachedCatalog.summary;
}

export async function POST(request: NextRequest) {
  const requestId = createRequestId("chat");

  try {
    const shouldEnforceRateLimit = process.env.NODE_ENV === "production";
    const rateLimitKey = buildChatRateLimitKey(request);

    if (shouldEnforceRateLimit && rateLimitKey) {
      const rateLimitResult = await checkServerRateLimit({
        namespace: "chat",
        key: rateLimitKey,
        maxRequests: CHAT_RATE_LIMIT_MAX,
        windowMs: CHAT_RATE_LIMIT_WINDOW_MS,
      });
      if (!rateLimitResult.allowed) {
        return apiError("RATE_LIMITED", "Too many requests. Please wait before sending another message.", 429, {
          requestId,
          retryAfterMs: rateLimitResult.retryAfterMs,
          retryable: true,
          extra: {
            reply: getFallbackReply("busy"),
          },
        });
      }
    }

    const rawBody = await withTimeout(
      request.json(),
      REQUEST_BODY_TIMEOUT_MS,
      "Chat request body parsing timed out."
    );

    const parsedBody = chatRequestSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return apiError("VALIDATION_ERROR", "Invalid chat payload.", 400, {
        requestId,
        fieldErrors: zodIssuesToFieldErrors(parsedBody.error.issues),
        extra: {
          reply: getFallbackReply("validation"),
        },
      });
    }

    const { message, history } = parsedBody.data;
    const catalogSummary = await getRAGContext(requestId);
    const catalog = cachedCatalog || {
      properties: [],
      services: [],
      summary: catalogSummary,
    };
    const retrievalContext = buildRetrievedContext(message, history, catalog);
    const deterministicReply = buildDeterministicReply(message, history, catalog);

    if (!process.env.GOOGLE_AI_API_KEY) {
      return apiSuccess(
        {
          reply: deterministicReply,
          source: "db-fallback",
        },
        {
          requestId,
          extra: {
            reply: deterministicReply,
            source: "db-fallback",
          },
        }
      );
    }

    const providerBackoffRemainingMs = getModelProviderBackoffRemainingMs();
    if (providerBackoffRemainingMs > 0) {
      return apiSuccess(
        {
          reply: deterministicReply,
          source: "db-fallback",
        },
        {
          requestId,
          extra: {
            reply: deterministicReply,
            source: "db-fallback",
            modelBackoffMs: providerBackoffRemainingMs,
          },
        }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const conversationHistory = history
      .slice(-6)
      .map((entry) => `${entry.role === "user" ? "User" : "Assistant"}: ${entry.content}`)
      .join("\n");

    const fullPrompt = `${SYSTEM_PROMPT}

  ${catalogSummary}

  ${retrievalContext}

${conversationHistory ? `Recent conversation:\n${conversationHistory}\n` : ""}
User: ${message}

Respond helpfully and concisely:`;

    let reply = deterministicReply;
    let source: "gemini" | "db-fallback" = "db-fallback";

    try {
      reply = await retryWithExponentialBackoff(
        async () => {
          const result = await withTimeout(
            model.generateContent(fullPrompt),
            MODEL_RESPONSE_TIMEOUT_MS,
            "AI response generation timed out."
          );
          const text = result.response.text().trim();

          if (!text) {
            throw new Error("AI returned an empty response.");
          }

          return text;
        },
        {
          retries: 0,
          initialDelayMs: 350,
          maxDelayMs: 1800,
          shouldRetry: (error) => isRetryableModelError(error),
        }
      );
      source = "gemini";
    } catch (modelError) {
      const retryableModelError = isRetryableModelError(modelError);

      if (retryableModelError) {
        const backoffMs = registerModelProviderBackoff(modelError);

        if (shouldReportRetryableModelError()) {
          reportError(modelError, {
            route: "/api/chat",
            requestId,
            stage: "model_generation_retryable",
            providerBackoffMs: backoffMs,
          });
        }
      } else {
        reportError(modelError, {
          route: "/api/chat",
          requestId,
          stage: "model_generation",
        });
      }

      source = "db-fallback";
    }

    return apiSuccess(
      {
        reply,
        source,
      },
      {
        requestId,
        extra: {
          reply,
          source,
        },
      }
    );
  } catch (error) {
    if (error instanceof TimeoutError) {
      return apiError("REQUEST_TIMEOUT", "Request timed out. Please try again.", 504, {
        requestId,
        retryable: true,
        extra: {
          reply: getFallbackReply("busy"),
        },
      });
    }

    reportError(error, {
      route: "/api/chat",
      requestId,
      stage: "post_handler",
    });

    if (isRetryableModelError(error)) {
      return apiError("SERVICE_UNAVAILABLE", "AI assistant is temporarily unavailable.", 503, {
        requestId,
        retryable: true,
        extra: {
          reply: getFallbackReply("busy"),
        },
      });
    }

    return apiError("INTERNAL_ERROR", "Failed to generate a response.", 500, {
      requestId,
      extra: {
        reply: getFallbackReply("default"),
      },
    });
  }
}
