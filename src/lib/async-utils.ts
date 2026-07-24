export class TimeoutError extends Error {
  readonly timeoutMs: number;

  constructor(message: string, timeoutMs: number) {
    super(message);
    this.name = "TimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

export type RetryOptions = {
  retries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  factor?: number;
  jitter?: boolean;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
  signal?: AbortSignal;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && typeof error.message === "string") {
    return error.message;
  }

  if (isObject(error)) {
    const maybeMessage = error.message;
    if (typeof maybeMessage === "string") {
      return maybeMessage;
    }
  }

  return String(error || "Unknown error");
}

export function isTimeoutError(error: unknown): boolean {
  if (error instanceof TimeoutError) {
    return true;
  }

  const message = getErrorMessage(error).toLowerCase();
  return message.includes("timed out") || message.includes("timeout");
}

export function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }

  if (error instanceof Error && error.name === "AbortError") {
    return true;
  }

  const message = getErrorMessage(error).toLowerCase();
  return message.includes("aborted");
}

export function isTransientNetworkError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();

  return (
    message.includes("timed out") ||
    message.includes("timeout") ||
    message.includes("network") ||
    message.includes("failed to fetch") ||
    message.includes("fetch failed") ||
    message.includes("socket") ||
    message.includes("econn") ||
    message.includes("connection") ||
    message.includes("503") ||
    message.includes("502") ||
    message.includes("504") ||
    message.includes("429") ||
    message.includes("too many requests") ||
    message.includes("temporarily unavailable") ||
    isTimeoutError(error)
  );
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    const onAbort = () => {
      cleanup();
      reject(new Error("Retry aborted by signal."));
    };

    const cleanup = () => {
      clearTimeout(timer);
      if (signal) {
        signal.removeEventListener("abort", onAbort);
      }
    };

    if (signal) {
      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}

export async function retryWithExponentialBackoff<T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    retries = 2,
    initialDelayMs = 250,
    maxDelayMs = 3000,
    factor = 2,
    jitter = true,
    shouldRetry = () => true,
    onRetry,
    signal,
  } = options;

  let attempt = 0;
  let currentDelayMs = Math.max(0, initialDelayMs);

  for (;;) {
    if (signal?.aborted) {
      throw new Error("Operation aborted by signal.");
    }

    try {
      return await operation(attempt);
    } catch (error) {
      if (attempt >= retries || !shouldRetry(error, attempt)) {
        throw error;
      }

      const jitterMs = jitter ? Math.floor(Math.random() * 120) : 0;
      const delayMs = Math.min(maxDelayMs, currentDelayMs + jitterMs);

      onRetry?.(error, attempt + 1, delayMs);
      await sleep(delayMs, signal);

      currentDelayMs = Math.min(maxDelayMs, Math.max(initialDelayMs, currentDelayMs * factor));
      attempt += 1;
    }
  }
}

export async function withTimeout<T>(
  promise: PromiseLike<T>,
  timeoutMs: number,
  timeoutMessage = "Operation timed out."
): Promise<T> {
  if (timeoutMs <= 0) {
    return Promise.resolve(promise);
  }

  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TimeoutError(timeoutMessage, timeoutMs));
    }, timeoutMs);
  });

  try {
    return await Promise.race([Promise.resolve(promise), timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    return await fetch(input, {
      ...init,
      signal: init.signal ?? controller.signal,
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw new TimeoutError("Request timed out.", timeoutMs);
    }
    throw error;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
