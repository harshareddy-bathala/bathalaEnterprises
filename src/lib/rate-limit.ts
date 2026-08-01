type RateLimitAllowed = { allowed: true };
type RateLimitBlocked = { allowed: false; retryAfterMs: number };

export type RateLimitResult = RateLimitAllowed | RateLimitBlocked;

export type RateLimitOptions = {
  namespace: string;
  key: string;
  maxRequests: number;
  windowMs: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type UpstashConfig = {
  baseUrl: string;
  token: string;
};

const MAX_MEMORY_BUCKETS = 5000;

declare global {
  var __bathalaRateLimitStore: Map<string, RateLimitBucket> | undefined;
}

function getMemoryStore(): Map<string, RateLimitBucket> {
  if (!globalThis.__bathalaRateLimitStore) {
    globalThis.__bathalaRateLimitStore = new Map<string, RateLimitBucket>();
  }

  return globalThis.__bathalaRateLimitStore;
}

function getUpstashConfig(): UpstashConfig | null {
  const baseUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!baseUrl || !token) {
    return null;
  }

  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    token,
  };
}

function normalizeKey(input: string): string {
  const normalized = input.trim();
  return normalized.length > 0 ? normalized : "unknown";
}

function toStorageKey(namespace: string, key: string): string {
  return `ratelimit:${namespace}:${normalizeKey(key)}`;
}

function cleanupMemoryStore(store: Map<string, RateLimitBucket>, now: number): void {
  for (const [bucketKey, bucket] of store.entries()) {
    if (now >= bucket.resetAt) {
      store.delete(bucketKey);
    }
  }
}

function checkMemoryRateLimit(options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const storageKey = toStorageKey(options.namespace, options.key);
  const store = getMemoryStore();

  if (store.size > MAX_MEMORY_BUCKETS) {
    cleanupMemoryStore(store, now);
  }

  const existing = store.get(storageKey);

  if (!existing || now >= existing.resetAt) {
    store.set(storageKey, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return { allowed: true };
  }

  if (existing.count >= options.maxRequests) {
    return {
      allowed: false,
      retryAfterMs: Math.max(0, existing.resetAt - now),
    };
  }

  existing.count += 1;
  return { allowed: true };
}

async function runUpstashCommand(
  config: UpstashConfig,
  command: string,
  ...args: Array<string | number>
): Promise<unknown> {
  const encodedArgs = args.map((arg) => encodeURIComponent(String(arg)));
  const url = `${config.baseUrl}/${command.toLowerCase()}/${encodedArgs.join("/")}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${config.token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Upstash command failed: ${command} (${response.status})`);
  }

  const payload = (await response.json()) as { result?: unknown; error?: string };

  if (typeof payload.error === "string" && payload.error.length > 0) {
    throw new Error(`Upstash command error: ${payload.error}`);
  }

  return payload.result;
}

async function checkDistributedRateLimit(
  config: UpstashConfig,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const storageKey = toStorageKey(options.namespace, options.key);

  const countResult = await runUpstashCommand(config, "INCR", storageKey);
  const count = Number(countResult);

  if (!Number.isFinite(count)) {
    throw new Error("Upstash INCR returned a non-numeric result.");
  }

  if (count === 1) {
    await runUpstashCommand(config, "PEXPIRE", storageKey, options.windowMs);
  }

  if (count > options.maxRequests) {
    const ttlResult = await runUpstashCommand(config, "PTTL", storageKey);
    let ttlMs = Number(ttlResult);

    if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
      await runUpstashCommand(config, "PEXPIRE", storageKey, options.windowMs);
      ttlMs = options.windowMs;
    }

    return {
      allowed: false,
      retryAfterMs: ttlMs,
    };
  }

  return { allowed: true };
}

export async function checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const upstashConfig = getUpstashConfig();

  if (!upstashConfig) {
    return checkMemoryRateLimit(options);
  }

  try {
    return await checkDistributedRateLimit(upstashConfig, options);
  } catch {
    // Fail open to in-memory fallback if distributed limiter is unavailable.
    return checkMemoryRateLimit(options);
  }
}
