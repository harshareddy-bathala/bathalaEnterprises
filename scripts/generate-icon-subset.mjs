#!/usr/bin/env node
/**
 * Regenerate the subset Material Symbols font in public/fonts/.
 *
 * The site self-hosts a subset of the icon font rather than linking a
 * version-pinned gstatic URL. That URL was both a single point of failure
 * (Google rotates them; when it 404s, every icon disappears) and the full
 * unsubsetted font — 3.2 MB for roughly 50 glyphs. The subset is ~11 KB.
 *
 * Run this whenever you add a new `material-symbols-outlined` icon, then
 * commit the regenerated .woff2:
 *
 *   node scripts/generate-icon-subset.mjs        # or: npm run icons:subset
 *
 * It scans src/ for icon names, asks the Google Fonts API for a font
 * containing exactly those glyphs, and writes it to public/fonts/.
 */

import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import path from "node:path";

const SRC_DIR = "src";
const OUTPUT = "public/fonts/material-symbols-outlined-subset.woff2";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/** Words that look like icon names but are not. */
const NOT_ICONS = new Set([
  "button", "icon", "icon_name", "outline", "react", "text", "true", "false",
]);

/** Files whose bare string literals are icon names (pickers, theme maps). */
const ICON_NAME_FILES = [
  "src/components/admin/icon-picker.tsx",
  "src/lib/service-format.ts",
  "src/lib/theme-constants.ts",
  "src/components/ui/empty-state.tsx",
];

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (/\.(tsx|ts)$/.test(entry.name)) out.push(full);
  }
  return out;
}

async function collectIconNames() {
  const names = new Set();
  const files = await walk(SRC_DIR);

  const spanRe =
    /<span\b(?:[^<>]|\{[^{}]*\})*?material-symbols-outlined(?:[^<>]|\{[^{}]*\})*?>([\s\S]*?)<\/span>/g;

  for (const file of files) {
    const source = await readFile(file, "utf8");

    for (const match of source.matchAll(spanRe)) {
      const body = match[1].trim();
      if (/^[a-z0-9_]+$/.test(body)) {
        names.add(body);
        continue;
      }
      // The body is an expression, e.g. {open ? "close" : "menu"} or {icon}.
      // Pull every quoted identifier out of it; a stray non-icon string is
      // harmless (Google's API ignores unknown names) but a missed one renders
      // as raw text in the UI.
      for (const lit of body.matchAll(/["'`]([a-z][a-z0-9_]{1,30})["'`]/g)) {
        names.add(lit[1]);
      }
    }
    for (const match of source.matchAll(/\bicon(?:Name)?=["']([a-z][a-z0-9_]{2,30})["']/g)) {
      names.add(match[1]);
    }
    for (const match of source.matchAll(/\bicon:\s*["']([a-z][a-z0-9_]{2,30})["']/g)) {
      names.add(match[1]);
    }
  }

  for (const file of ICON_NAME_FILES) {
    let source;
    try {
      source = await readFile(file, "utf8");
    } catch {
      continue;
    }
    for (const match of source.matchAll(/["']([a-z][a-z0-9_]{2,30})["']/g)) {
      names.add(match[1]);
    }
  }

  return [...names].filter((name) => !NOT_ICONS.has(name)).sort();
}

async function main() {
  const names = await collectIconNames();
  if (names.length === 0) {
    throw new Error("No icon names found — check the scan patterns.");
  }
  console.log(`Found ${names.length} icon names.`);

  const cssUrl =
    "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" +
    `&icon_names=${names.join(",")}`;

  const cssResponse = await fetch(cssUrl, { headers: { "User-Agent": USER_AGENT } });
  if (!cssResponse.ok) {
    throw new Error(`Google Fonts CSS request failed: ${cssResponse.status}`);
  }

  const css = await cssResponse.text();
  const fontUrl = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/)?.[1];
  if (!fontUrl) {
    throw new Error("No woff2 URL in the returned CSS.");
  }

  const fontResponse = await fetch(fontUrl, { headers: { "User-Agent": USER_AGENT } });
  if (!fontResponse.ok) {
    throw new Error(`Font download failed: ${fontResponse.status}`);
  }

  const buffer = Buffer.from(await fontResponse.arrayBuffer());
  if (buffer.subarray(0, 4).toString() !== "wOF2") {
    throw new Error("Downloaded file is not a woff2.");
  }

  await mkdir(path.dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, buffer);
  console.log(`Wrote ${OUTPUT} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
