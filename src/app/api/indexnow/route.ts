import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess, createRequestId, zodIssuesToFieldErrors } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limit";
import { reportError } from "@/lib/monitoring";
import { submitToIndexNow } from "@/lib/indexnow";

/**
 * POST /api/indexnow — notify IndexNow that listings changed.
 *
 * Called by the admin pages after a successful save. Not session-gated: the
 * destination is hardcoded and the payload is filtered down to URLs on our own
 * origin, so the worst an abuser achieves is asking Bing to re-crawl pages that
 * are already public. Rate limiting covers the remaining nuisance case, and
 * gating it would mean duplicating the middleware's Supabase session check for
 * no security gain.
 */

const INDEXNOW_RATE_LIMIT_MAX = 20;
const INDEXNOW_RATE_LIMIT_WINDOW_MS = 60_000;

const payloadSchema = z.object({
  urls: z.array(z.string().min(1)).min(1, "At least one URL is required.").max(100),
});

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  const requestId = createRequestId("indexnow");

  try {
    const rateLimit = await checkRateLimit({
      namespace: "indexnow",
      key: getClientIp(request),
      maxRequests: INDEXNOW_RATE_LIMIT_MAX,
      windowMs: INDEXNOW_RATE_LIMIT_WINDOW_MS,
    });

    if (!rateLimit.allowed) {
      return apiError("RATE_LIMITED", "Too many submissions. Please try again shortly.", 429, {
        requestId,
        retryAfterMs: rateLimit.retryAfterMs,
        retryable: true,
      });
    }

    const parsed = payloadSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid submission payload.", 400, {
        requestId,
        fieldErrors: zodIssuesToFieldErrors(parsed.error.issues),
      });
    }

    const result = await submitToIndexNow(parsed.data.urls);
    return apiSuccess(result, { requestId });
  } catch (error) {
    reportError(error, { route: "/api/indexnow", requestId, stage: "submit" });
    // Search-engine notification is best effort; never surface it as a failure
    // that could block an admin save.
    return apiSuccess({ status: "skipped", reason: "submission failed" }, { requestId });
  }
}
