import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Content Security Policy.
 *
 * On `script-src 'unsafe-inline'`:
 *
 * There used to be dead code here that generated a nonce, passed it to this
 * function, and then ignored it — implying nonce protection that did not exist.
 * The nonce has been removed rather than wired up, deliberately.
 *
 * Nonce-based CSP in Next requires a fresh nonce per request, which means every
 * page must be dynamically rendered. That would disable static optimization and
 * ISR across the whole site — exactly what this project spent Phase 1 and
 * Phase 2 restoring (static pages with `revalidate = 60`, plus
 * `generateStaticParams` pre-rendering the catalogue). For a marketing site
 * whose value is fast, cacheable, crawlable pages, trading all of that for
 * inline-script protection is the wrong exchange.
 * See https://nextjs.org/docs/app/guides/content-security-policy
 *
 * Next needs `'unsafe-inline'` for its hydration bootstrap scripts, and hashes
 * are impractical because that content differs per page. So the policy keeps
 * `'unsafe-inline'` for scripts and is tightened everywhere else instead:
 * `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` and a strict
 * host allow-list still block the most common injection payloads.
 *
 * If strict script CSP ever becomes a hard requirement, the options are
 * (a) accept fully dynamic rendering, or (b) move to a static export with
 * hashed inline scripts. Both are deliberate architecture changes.
 */
function buildCsp() {
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
  ];

  if (process.env.NODE_ENV !== "production") {
    scriptSrc.push("'unsafe-eval'");
  }

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    // No Google Fonts hosts: next/font self-hosts Inter and Playfair at build
    // time, and Material Symbols is now a local subset in public/fonts.
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co https://maps.google.com https://www.google.com",
    "frame-src 'self' https://www.google.com https://maps.google.com",
    "connect-src 'self' https://*.supabase.co https://generativelanguage.googleapis.com https://www.google-analytics.com https://region1.google-analytics.com",
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

function applyCsp(request: NextRequest, response: NextResponse): NextResponse {
  if (process.env.NODE_ENV !== "production") {
    return response;
  }

  response.headers.set("Content-Security-Policy", buildCsp());
  return response;
}

function isProtectedAdminPath(pathname: string): boolean {
  if (!pathname.startsWith("/admin")) {
    return false;
  }

  // The login page must stay reachable for unauthenticated users.
  return pathname !== "/admin/login";
}

/**
 * Server-side admin guard. Verifies the Supabase session cookie against the
 * auth server and confirms the user is an active admin via is_admin_user().
 * RLS remains the enforcement boundary for data access; this prevents the
 * admin UI shell from rendering for non-admins at all.
 *
 * Returns the response to send: either a redirect to /admin/login or a
 * pass-through response carrying any refreshed session cookies.
 */
async function guardAdminRoute(request: NextRequest): Promise<NextResponse> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const loginUrl = new URL("/admin/login", request.url);

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(loginUrl);
  }

  let response = NextResponse.next({
    request: { headers: new Headers(request.headers) },
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(loginUrl);
  }

  const { data: isAdmin, error } = await supabase.rpc("is_admin_user");

  if (error || isAdmin !== true) {
    const redirect = NextResponse.redirect(loginUrl);
    // Preserve any refreshed session cookies on the redirect.
    for (const cookie of response.cookies.getAll()) {
      redirect.cookies.set(cookie);
    }
    return redirect;
  }

  return response;
}

export async function proxy(request: NextRequest) {
  if (isProtectedAdminPath(request.nextUrl.pathname)) {
    return applyCsp(request, await guardAdminRoute(request));
  }

  return applyCsp(request, NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico|site.webmanifest|sw.js|offline.html|android-chrome-192x192.png|android-chrome-512x512.png|apple-touch-icon.png).*)",
  ],
};
