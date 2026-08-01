import { NextResponse } from "next/server";

type FieldErrors = Record<string, string[]>;

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "REQUEST_TIMEOUT"
  | "SERVICE_UNAVAILABLE"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INTERNAL_ERROR";

type ApiMeta = {
  requestId: string;
  timestamp: string;
  retryAfterMs?: number;
  retryable?: boolean;
};

type ApiSuccessBody<T> = {
  success: true;
  data: T;
  meta: ApiMeta;
};

type ApiErrorBody = {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: string;
    fieldErrors?: FieldErrors;
  };
  meta: ApiMeta;
};

function nowIsoString(): string {
  return new Date().toISOString();
}

export function createRequestId(prefix = "req"): string {
  const entropy = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}_${entropy}`;
}

export function zodIssuesToFieldErrors(
  issues: ReadonlyArray<{ path: ReadonlyArray<string | number>; message: string }>
): FieldErrors {
  const fieldErrors: FieldErrors = {};

  for (const issue of issues) {
    const field = issue.path.length > 0 ? String(issue.path[0]) : "form";
    if (!fieldErrors[field]) {
      fieldErrors[field] = [];
    }
    fieldErrors[field].push(issue.message);
  }

  return fieldErrors;
}

export function apiSuccess<T>(
  data: T,
  options: {
    status?: number;
    requestId?: string;
    retryAfterMs?: number;
    retryable?: boolean;
    extra?: Record<string, unknown>;
  } = {}
): NextResponse<ApiSuccessBody<T> & Record<string, unknown>> {
  const {
    status = 200,
    requestId = createRequestId(),
    retryAfterMs,
    retryable = false,
    extra,
  } = options;

  const body: ApiSuccessBody<T> & Record<string, unknown> = {
    success: true,
    data,
    meta: {
      requestId,
      timestamp: nowIsoString(),
      retryAfterMs,
      retryable,
    },
    ...(extra || {}),
  };

  const headers = retryAfterMs
    ? { "Retry-After": String(Math.max(1, Math.ceil(retryAfterMs / 1000))) }
    : undefined;

  return NextResponse.json(body, { status, headers });
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  options: {
    requestId?: string;
    details?: string;
    fieldErrors?: FieldErrors;
    retryAfterMs?: number;
    retryable?: boolean;
    extra?: Record<string, unknown>;
  } = {}
): NextResponse<ApiErrorBody & Record<string, unknown>> {
  const {
    requestId = createRequestId(),
    details,
    fieldErrors,
    retryAfterMs,
    retryable = false,
    extra,
  } = options;

  const body: ApiErrorBody & Record<string, unknown> = {
    success: false,
    error: {
      code,
      message,
      details,
      fieldErrors,
    },
    meta: {
      requestId,
      timestamp: nowIsoString(),
      retryAfterMs,
      retryable,
    },
    ...(extra || {}),
  };

  const headers = retryAfterMs
    ? { "Retry-After": String(Math.max(1, Math.ceil(retryAfterMs / 1000))) }
    : undefined;

  return NextResponse.json(body, { status, headers });
}
