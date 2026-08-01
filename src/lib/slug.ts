/**
 * URL slug helpers.
 *
 * Public detail URLs are keyword-rich rather than raw UUIDs:
 *   /properties/3-bhk-villa-electronic-city-3f9a1c
 *
 * The trailing segment is the first 6 hex characters of the row's UUID. It
 * guarantees uniqueness without a lookup loop, and keeps the mapping from slug
 * back to row cheap and deterministic. `SUPABASE_ADD_SLUGS.sql` backfills the
 * stored `slug` column using the same rule.
 */

const ID_SUFFIX_LENGTH = 6;
const MAX_BASE_LENGTH = 60;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** True when the value is a bare UUID (i.e. a legacy pre-slug URL). */
export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/** Lowercase, ASCII-folded, hyphen-separated form of a title. No id suffix. */
export function slugifyBase(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_BASE_LENGTH)
    .replace(/-+$/g, "");
}

function idSuffix(id: string): string {
  return id.replace(/-/g, "").slice(0, ID_SUFFIX_LENGTH).toLowerCase();
}

/** Canonical slug for a row. Falls back to the id suffix for empty titles. */
export function toSlug(title: string, id: string): string {
  const base = slugifyBase(title || "");
  const suffix = idSuffix(id);
  return base ? `${base}-${suffix}` : suffix;
}

/**
 * The id fragment a slug ends with, or null when the value is not slug-shaped.
 * Used to resolve a row when the stored `slug` column is unavailable.
 */
export function idPrefixFromSlug(slug: string): string | null {
  const match = /(?:^|-)([0-9a-f]{6})$/i.exec(slug);
  return match ? match[1].toLowerCase() : null;
}

type Sluggable = { id: string; title: string; slug?: string };

/**
 * Canonical public path for a property. Falls back to a computed slug so links
 * still work against a database that has not run SUPABASE_ADD_SLUGS.sql.
 *
 * Lives here rather than in supabase-queries so client components can link
 * without pulling the query layer into their bundle.
 */
export function propertyPath(property: Sluggable): string {
  return `/properties/${property.slug || toSlug(property.title, property.id)}`;
}

/** Canonical public path for a service. */
export function servicePath(service: Sluggable): string {
  return `/services/${service.slug || toSlug(service.title, service.id)}`;
}
