import { getIndexNowKey } from "@/lib/indexnow";

/**
 * IndexNow key file. The service fetches this to prove we control the host
 * before accepting submissions; its body must be exactly the key.
 *
 * Served from a fixed path (rather than the conventional `<key>.txt`) and
 * declared via `keyLocation` in the payload, so rotating the key is an env
 * change with no route change.
 */
export const dynamic = "force-static";
export const revalidate = 86400;

export function GET() {
  const key = getIndexNowKey();

  if (!key) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(key, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
