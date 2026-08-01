export const QA_CORE_ROUTES = ["/", "/properties", "/services", "/contact"] as const;

export type QaRoute = (typeof QA_CORE_ROUTES)[number];
