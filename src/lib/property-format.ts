import { formatNumber } from "@/lib/format";
import type { PropertyType } from "@/types/tables";

type CurrencyMode = "symbol" | "code";

type DisplayPriceOptions = {
  currencyMode?: CurrencyMode;
};

function getCurrencyPrefix(currencyMode: CurrencyMode): string {
  return currencyMode === "code" ? "INR " : "₹";
}

export function prettyType(type: PropertyType): string {
  if (type === "Rent") return "For Rent";
  if (type === "Sale") return "For Sale";
  return "For Lease";
}

export function displayPrice(type: PropertyType, price: number, options: DisplayPriceOptions = {}): string {
  const prefix = getCurrencyPrefix(options.currencyMode ?? "symbol");

  if (type !== "Sale") {
    return `${prefix}${formatNumber(price)}`;
  }

  if (price >= 10000000) {
    const cr = price / 10000000;
    return `${prefix}${Number.isInteger(cr) ? cr.toFixed(0) : cr.toFixed(1)} Cr`;
  }

  if (price >= 100000) {
    return `${prefix}${(price / 100000).toFixed(1)} L`;
  }

  return `${prefix}${formatNumber(price)}`;
}

export function priceSuffix(type: PropertyType): string {
  if (type === "Sale") return "onwards";
  if (type === "Lease") return "per year";
  return "per month";
}