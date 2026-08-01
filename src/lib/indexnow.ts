/**
 * IndexNow submission.
 *
 * Pushes changed URLs to Bing / Copilot (and other IndexNow participants)
 * within minutes instead of waiting for the next crawl. Google does not
 * participate, so this complements the sitemap rather than replacing it.
 *
 * Disabled unless INDEXNOW_KEY is set, so it is a no-op until the domain is
 * live and the key file is reachable.
 */

import { fetchWithTimeout } from "@/lib/async-utils";
import { logInfo, logWarn } from "@/lib/logger";
import { siteUrl } from "@/lib/seo";

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const SUBMIT_TIMEOUT_MS = 5_000;
const MAX_URLS_PER_SUBMISSION = 100;

/** Path that serves the key; referenced as `keyLocation` in the payload. */
export const INDEXNOW_KEY_PATH = "/indexnow-key.txt";

export function getIndexNowKey(): string | null {
  const key = process.env.INDEXNOW_KEY?.trim();
  return key ? key : null;
}

/** Keep only absolute URLs on our own origin — IndexNow rejects the rest anyway. */
export function filterSameOriginUrls(urls: string[]): string[] {
  const origin = (() => {
    try {
      return new URL(siteUrl).origin;
    } catch {
      return null;
    }
  })();

  if (!origin) return [];

  const unique = new Set<string>();
  for (const raw of urls) {
    try {
      const parsed = new URL(raw, siteUrl);
      if (parsed.origin === origin) {
        unique.add(parsed.toString());
      }
    } catch {
      // Ignore unparseable entries.
    }
  }

  return Array.from(unique).slice(0, MAX_URLS_PER_SUBMISSION);
}

export type IndexNowResult =
  | { status: "disabled" }
  | { status: "skipped"; reason: string }
  | { status: "submitted"; count: number; upstreamStatus: number };

export async function submitToIndexNow(urls: string[]): Promise<IndexNowResult> {
  const key = getIndexNowKey();
  if (!key) {
    return { status: "disabled" };
  }

  const urlList = filterSameOriginUrls(urls);
  if (urlList.length === 0) {
    return { status: "skipped", reason: "no valid same-origin urls" };
  }

  const host = new URL(siteUrl).host;

  const response = await fetchWithTimeout(
    INDEXNOW_ENDPOINT,
    {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key,
        keyLocation: `${siteUrl}${INDEXNOW_KEY_PATH}`,
        urlList,
      }),
    },
    SUBMIT_TIMEOUT_MS
  );

  // IndexNow answers 200/202 on success; 4xx usually means the key file is not
  // reachable yet. Never fatal — this is a best-effort notification.
  if (!response.ok) {
    logWarn("IndexNow submission rejected", {
      upstreamStatus: response.status,
      count: urlList.length,
    });
  } else {
    logInfo("IndexNow submission accepted", {
      upstreamStatus: response.status,
      count: urlList.length,
    });
  }

  return { status: "submitted", count: urlList.length, upstreamStatus: response.status };
}
