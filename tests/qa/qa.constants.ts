export const QA_CORE_ROUTES = ["/", "/all-properties", "/all-services", "/contact"] as const;

export type QaRoute = (typeof QA_CORE_ROUTES)[number];
