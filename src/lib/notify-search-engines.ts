/**
 * Browser-side helper: tell search engines that listing URLs changed.
 *
 * Fire-and-forget by design — an admin save must never fail, or feel slower,
 * because a search-engine notification did not go through. The server route is
 * a no-op unless INDEXNOW_KEY is configured.
 */

const NOTIFY_ENDPOINT = "/api/indexnow";

/**
 * @param paths site-relative paths that changed, e.g. ["/properties", "/properties/villa-3f9a1c"]
 */
export function notifySearchEngines(paths: string[]): void {
  if (typeof window === "undefined" || paths.length === 0) {
    return;
  }

  const urls = paths.map((path) => new URL(path, window.location.origin).toString());

  void fetch(NOTIFY_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urls }),
    keepalive: true,
  }).catch(() => {
    // Best effort only.
  });
}
