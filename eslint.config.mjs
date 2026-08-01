import nextVitals from "eslint-config-next/core-web-vitals";

/** @type {import('eslint').Linter.Config[]} */
const config = [
  ...nextVitals,
  {
    rules: {
      /*
       * The react-hooks family below was set to "off", which made dependency
       * and effect bugs structurally invisible across ~4,200 lines of
       * hook-heavy admin CSR with Supabase Realtime subscriptions.
       *
       * They are "warn" rather than "error" because there are 19 pre-existing
       * findings, almost all `set-state-in-effect` in admin CRUD pages.
       * Changing a hook's dependency array alters when effects re-run, so those
       * need fixing one at a time with the admin flows exercised against a live
       * database — not swept blind. "warn" keeps CI green while making the debt
       * visible on every run.
       *
       * Promote to "error" once the backlog is cleared, so new code cannot add
       * to it.
       */
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/incompatible-library": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/preserve-manual-memoization": "warn",

      /*
       * Enabled. The site uses next/image everywhere; the only raw <img> is
       * inside a next/og ImageResponse, which renders its own JSX subset and
       * cannot use next/image — that one site carries a targeted disable.
       * Leaving this off undercut the LCP budget.
       */
      "@next/next/no-img-element": "warn",

      /*
       * Off deliberately:
       * - no-page-custom-font / google-font-*: fonts are self-hosted via
       *   next/font plus a local Material Symbols subset, so these
       *   Google-Fonts-specific rules do not apply.
       * - no-html-link-for-pages: false positives under the App Router.
       * - react/no-unescaped-entities: the marketing copy uses apostrophes
       *   heavily and they are escaped where it matters.
       */
      "@next/next/no-page-custom-font": "off",
      "@next/next/google-font-preconnect": "off",
      "@next/next/google-font-display": "off",
      "@next/next/no-html-link-for-pages": "off",
      "react/no-unescaped-entities": "off"
    }
  }
];

export default config;
