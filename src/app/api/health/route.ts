import { NextRequest } from "next/server";
import { apiError, apiSuccess, createRequestId } from "@/lib/api-response";
import { fetchWithTimeout } from "@/lib/async-utils";
import { checkRateLimit } from "@/lib/rate-limit";

const HEALTH_RATE_LIMIT_MAX = 12;
const HEALTH_RATE_LIMIT_WINDOW_MS = 60_000;

type CheckState = "ok" | "warn" | "fail" | "skipped";

type HealthCheckResult = {
  name: string;
  state: CheckState;
  message: string;
  latencyMs?: number;
};

function elapsed(startMs: number): number {
  return Date.now() - startMs;
}

async function checkSupabase(): Promise<HealthCheckResult> {
  const startMs = Date.now();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return {
      name: "supabase",
      state: "fail",
      message: "Supabase environment variables are missing.",
    };
  }

  try {
    const response = await fetchWithTimeout(
      `${url}/auth/v1/health`,
      {
        headers: {
          apikey: key,
        },
      },
      5_000
    );

    if (!response.ok) {
      return {
        name: "supabase",
        state: "fail",
        message: `Supabase health check returned ${response.status}.`,
        latencyMs: elapsed(startMs),
      };
    }

    return {
      name: "supabase",
      state: "ok",
      message: "Supabase reachable.",
      latencyMs: elapsed(startMs),
    };
  } catch (error) {
    return {
      name: "supabase",
      state: "fail",
      message: error instanceof Error ? error.message : "Supabase health check failed.",
      latencyMs: elapsed(startMs),
    };
  }
}

async function checkGoogleAi(): Promise<HealthCheckResult> {
  const startMs = Date.now();
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    return {
      name: "google-ai",
      state: "warn",
      message: "GOOGLE_AI_API_KEY is not configured.",
    };
  }

  try {
    const response = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
      {},
      7_000
    );

    if (!response.ok) {
      return {
        name: "google-ai",
        state: "warn",
        message: `Google AI check returned ${response.status}.`,
        latencyMs: elapsed(startMs),
      };
    }

    return {
      name: "google-ai",
      state: "ok",
      message: "Google AI API reachable.",
      latencyMs: elapsed(startMs),
    };
  } catch (error) {
    return {
      name: "google-ai",
      state: "warn",
      message: error instanceof Error ? error.message : "Google AI check failed.",
      latencyMs: elapsed(startMs),
    };
  }
}

async function checkResend(): Promise<HealthCheckResult> {
  const startMs = Date.now();
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return {
      name: "resend",
      state: "warn",
      message: "RESEND_API_KEY is not configured.",
    };
  }

  try {
    const response = await fetchWithTimeout(
      "https://api.resend.com/domains",
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
      7_000
    );

    if (!response.ok) {
      return {
        name: "resend",
        state: "warn",
        message: `Resend check returned ${response.status}.`,
        latencyMs: elapsed(startMs),
      };
    }

    return {
      name: "resend",
      state: "ok",
      message: "Resend API reachable.",
      latencyMs: elapsed(startMs),
    };
  } catch (error) {
    return {
      name: "resend",
      state: "warn",
      message: error instanceof Error ? error.message : "Resend check failed.",
      latencyMs: elapsed(startMs),
    };
  }
}

export async function GET(request: NextRequest) {
  const requestId = createRequestId("health");
  const startedAt = Date.now();

  // The health check fans out to three upstream APIs; rate-limit it so it
  // cannot be used to relay traffic at Supabase/Google/Resend.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const rateLimitResult = await checkRateLimit({
    namespace: "health",
    key: ip,
    maxRequests: HEALTH_RATE_LIMIT_MAX,
    windowMs: HEALTH_RATE_LIMIT_WINDOW_MS,
  });

  if (!rateLimitResult.allowed) {
    return apiError("RATE_LIMITED", "Too many health checks. Please wait.", 429, {
      requestId,
      retryAfterMs: rateLimitResult.retryAfterMs,
      retryable: true,
    });
  }

  const checks = await Promise.all([checkSupabase(), checkGoogleAi(), checkResend()]);

  const hasFailure = checks.some((check) => check.state === "fail");
  const hasWarning = checks.some((check) => check.state === "warn");

  const status = hasFailure ? "down" : hasWarning ? "degraded" : "ok";
  const statusCode = hasFailure ? 503 : 200;

  return apiSuccess(
    {
      status,
      checkedAt: new Date().toISOString(),
      uptimeMs: process.uptime() * 1000,
      responseTimeMs: Date.now() - startedAt,
      checks,
      environment: process.env.NODE_ENV || "development",
      version: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || "unknown",
    },
    {
      requestId,
      status: statusCode,
    }
  );
}
