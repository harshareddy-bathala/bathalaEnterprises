import { fetchWithTimeout } from "@/lib/async-utils";
import { logError } from "@/lib/logger";

type MonitoringContext = Record<string, unknown>;

type MaybeSentry = {
  captureException?: (error: unknown, context?: { extra?: MonitoringContext }) => void;
};

const ERROR_TRACKING_WEBHOOK_URL = process.env.ERROR_TRACKING_WEBHOOK_URL;
const ERROR_TRACKING_WEBHOOK_TOKEN = process.env.ERROR_TRACKING_WEBHOOK_TOKEN;
const ERROR_TRACKING_TIMEOUT_MS = 4_000;

function getSentryRuntime(): MaybeSentry | null {
  if (typeof globalThis === "undefined") {
    return null;
  }

  const runtime = globalThis as { Sentry?: MaybeSentry; __SENTRY__?: MaybeSentry };
  return runtime.Sentry || runtime.__SENTRY__ || null;
}

function toMonitoringPayload(error: unknown): { name: string; message: string; stack?: string } {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    name: "UnknownError",
    message: String(error || "Unknown error"),
  };
}

async function sendErrorToWebhook(
  payload: { name: string; message: string; stack?: string },
  context: MonitoringContext
): Promise<void> {
  if (!ERROR_TRACKING_WEBHOOK_URL) {
    return;
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (ERROR_TRACKING_WEBHOOK_TOKEN) {
      headers.Authorization = `Bearer ${ERROR_TRACKING_WEBHOOK_TOKEN}`;
    }

    await fetchWithTimeout(
      ERROR_TRACKING_WEBHOOK_URL,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          type: "application_error",
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || "development",
          error: payload,
          context,
        }),
      },
      ERROR_TRACKING_TIMEOUT_MS
    );
  } catch (webhookError) {
    logError("error tracking webhook failed", {
      originalError: payload.message,
      webhookError: webhookError instanceof Error ? webhookError.message : String(webhookError),
    });
  }
}

export function reportError(error: unknown, context: MonitoringContext = {}): void {
  const payload = toMonitoringPayload(error);

  logError("captured application error", {
    ...payload,
    context,
  });

  // Sentry hook (if a runtime/global integration is present).
  const sentry = getSentryRuntime();
  if (sentry?.captureException) {
    sentry.captureException(error, { extra: context });
  }

  void sendErrorToWebhook(payload, context);
}
