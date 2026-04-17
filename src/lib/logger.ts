import { fetchWithTimeout } from "@/lib/async-utils";

type LogLevel = "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

type LogPayload = {
  level: LogLevel;
  message: string;
  timestamp: string;
  service: string;
  environment: string;
  context: LogContext;
};

const LOG_INGEST_TIMEOUT_MS = 3_500;
const LOG_INGEST_ENDPOINT = process.env.LOG_INGEST_URL;
const LOG_INGEST_TOKEN = process.env.LOG_INGEST_TOKEN;

function toSafeContext(context: LogContext): LogContext {
  try {
    return JSON.parse(JSON.stringify(context)) as LogContext;
  } catch {
    return { rawContext: String(context) };
  }
}

async function forwardLog(payload: LogPayload): Promise<void> {
  if (!LOG_INGEST_ENDPOINT) {
    return;
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (LOG_INGEST_TOKEN) {
      headers.Authorization = `Bearer ${LOG_INGEST_TOKEN}`;
    }

    const response = await fetchWithTimeout(
      LOG_INGEST_ENDPOINT,
      {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      },
      LOG_INGEST_TIMEOUT_MS
    );

    if (!response.ok) {
      console.warn("[logger] remote log ingestion failed", {
        status: response.status,
        statusText: response.statusText,
      });
    }
  } catch (error) {
    console.warn("[logger] remote log forwarding failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export function log(level: LogLevel, message: string, context: LogContext = {}): void {
  if (process.env.NODE_ENV !== "production") {
    if (level === "error") {
      console.error(message, context);
      return;
    }

    if (level === "warn") {
      console.warn(message, context);
      return;
    }

    return;
  }

  const payload: LogPayload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    service: "bathala-web",
    environment: process.env.NODE_ENV || "development",
    context: toSafeContext(context),
  };

  const method = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  method("[app-log]", payload);

  void forwardLog(payload);
}

export function logInfo(message: string, context: LogContext = {}): void {
  log("info", message, context);
}

export function logWarn(message: string, context: LogContext = {}): void {
  log("warn", message, context);
}

export function logError(message: string, context: LogContext = {}): void {
  log("error", message, context);
}
