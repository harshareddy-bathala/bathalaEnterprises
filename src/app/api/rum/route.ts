import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess, createRequestId, zodIssuesToFieldErrors } from "@/lib/api-response";
import { fetchWithTimeout } from "@/lib/async-utils";
import { logInfo, logWarn } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";

// Generous: a real page view emits a handful of web-vitals beacons.
const RUM_RATE_LIMIT_MAX = 60;
const RUM_RATE_LIMIT_WINDOW_MS = 60_000;

const rumPayloadSchema = z.object({
  name: z.string().min(1).max(40),
  value: z.number().finite().nonnegative(),
  rating: z.enum(["good", "needs-improvement", "poor"]).optional(),
  id: z.string().max(100).optional(),
  path: z.string().max(500),
  source: z.enum(["web-vitals", "custom", "analytics"]).default("web-vitals"),
  timestamp: z.string().datetime().optional(),
  userAgent: z.string().max(400).optional(),
});

const RUM_INGEST_URL = process.env.RUM_INGEST_URL;
const RUM_INGEST_TOKEN = process.env.RUM_INGEST_TOKEN;
const RUM_FORWARD_TIMEOUT_MS = 3_500;

async function forwardRumEvent(event: Record<string, unknown>): Promise<void> {
  if (!RUM_INGEST_URL) {
    return;
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (RUM_INGEST_TOKEN) {
      headers.Authorization = `Bearer ${RUM_INGEST_TOKEN}`;
    }

    const response = await fetchWithTimeout(
      RUM_INGEST_URL,
      {
        method: "POST",
        headers,
        body: JSON.stringify(event),
      },
      RUM_FORWARD_TIMEOUT_MS
    );

    if (!response.ok) {
      logWarn("RUM event forwarding returned non-OK response", {
        status: response.status,
        statusText: response.statusText,
      });
    }
  } catch (error) {
    logWarn("RUM event forwarding failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function POST(request: NextRequest) {
  const requestId = createRequestId("rum");

  try {
    const clientIpForLimit =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const rateLimitResult = await checkRateLimit({
      namespace: "rum",
      key: clientIpForLimit,
      maxRequests: RUM_RATE_LIMIT_MAX,
      windowMs: RUM_RATE_LIMIT_WINDOW_MS,
    });

    if (!rateLimitResult.allowed) {
      return apiError("RATE_LIMITED", "Too many metrics.", 429, {
        requestId,
        retryAfterMs: rateLimitResult.retryAfterMs,
      });
    }

    const payload = await request.json();
    const parsedPayload = rumPayloadSchema.safeParse(payload);

    if (!parsedPayload.success) {
      return apiError("VALIDATION_ERROR", "Invalid RUM payload.", 400, {
        requestId,
        fieldErrors: zodIssuesToFieldErrors(parsedPayload.error.issues),
      });
    }

    const metricEvent = {
      ...parsedPayload.data,
      requestId,
      ip: clientIpForLimit,
      receivedAt: new Date().toISOString(),
    };

    logInfo("RUM metric received", metricEvent);
    void forwardRumEvent(metricEvent);

    return apiSuccess({ accepted: true }, { requestId, status: 202 });
  } catch (error) {
    logWarn("RUM route failed to process payload", {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });

    return apiError("INTERNAL_ERROR", "Failed to process RUM payload.", 500, {
      requestId,
      retryable: true,
    });
  }
}
