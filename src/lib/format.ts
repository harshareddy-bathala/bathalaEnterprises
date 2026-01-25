/**
 * Format number without locale-specific formatting to avoid hydration mismatches
 * between server and client rendering
 */
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
