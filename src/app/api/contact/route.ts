import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { z } from "zod";
import { apiError, apiSuccess, createRequestId, zodIssuesToFieldErrors } from "@/lib/api-response";
import {
  isTransientNetworkError,
  retryWithExponentialBackoff,
  TimeoutError,
  withTimeout,
} from "@/lib/async-utils";
import { reportError } from "@/lib/monitoring";
import { checkRateLimit as checkServerRateLimit } from "@/lib/rate-limit";
import { normalizeIndianPhone, sanitizeEmail, sanitizeString } from "@/lib/security";

const queryTypes = ["properties", "services"] as const;

const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(254),
  phone: z.string().max(32).nullable().optional(),
  query_type: z.enum(queryTypes),
  service_type: z.string().max(200).nullable().optional(),
  message: z.string().min(10).max(2000),
});

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY;
const CONTACT_RATE_LIMIT_MAX = 5;
const CONTACT_RATE_LIMIT_WINDOW_MS = 60_000;
const REQUEST_BODY_TIMEOUT_MS = 8_000;
const MESSAGE_INSERT_TIMEOUT_MS = 10_000;
const EMAIL_SEND_TIMEOUT_MS = 10_000;

const publicSupabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

const privilegedSupabase =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

const messageStoreClient = privilegedSupabase ?? publicSupabase;
const settingsReadClient = privilegedSupabase ?? publicSupabase;

function isRlsPolicyError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = "code" in error ? String((error as { code?: unknown }).code || "") : "";
  const message =
    "message" in error
      ? String((error as { message?: unknown }).message || "").toLowerCase()
      : "";

  return code === "42501" || message.includes("row-level security policy");
}

function getSupabaseErrorInfo(error: unknown): {
  code: string | null;
  message: string;
  details: string | null;
} {
  if (!error || typeof error !== "object") {
    return {
      code: null,
      message: String(error || "Unknown Supabase error"),
      details: null,
    };
  }

  const payload = error as {
    code?: unknown;
    message?: unknown;
    details?: unknown;
  };

  return {
    code: typeof payload.code === "string" ? payload.code : null,
    message:
      typeof payload.message === "string" && payload.message.trim().length > 0
        ? payload.message
        : "Unknown Supabase error",
    details: typeof payload.details === "string" ? payload.details : null,
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (error && typeof error === "object" && "message" in error) {
    const value = (error as { message?: unknown }).message;
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return String(error || "Unknown error");
}

async function resolveNotificationRecipientEmail(): Promise<string | null> {
  const configuredEmail = sanitizeEmail(process.env.CONTACT_EMAIL || "");

  // Prefer explicit environment configuration for operational predictability.
  if (configuredEmail) {
    return configuredEmail;
  }

  if (!settingsReadClient) {
    return null;
  }

  try {
    const { data, error } = await settingsReadClient
      .from("site_settings")
      .select("email")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error) {
      const settingsEmail = sanitizeEmail(typeof data?.email === "string" ? data.email : "");
      if (settingsEmail) {
        return settingsEmail;
      }
    }
  } catch {
    // Ignore settings read failures and return null if no env value is configured.
  }

  return null;
}

function notificationsEnabled(): boolean {
  const raw = (process.env.CONTACT_EMAIL_NOTIFICATIONS ?? "true").trim().toLowerCase();
  return !["false", "0", "off", "no"].includes(raw);
}

function buildEmailHtml(params: {
  messageId: string;
  name: string;
  email: string;
  phone: string | null;
  queryTypeDisplay: string;
  serviceType: string | null;
  message: string;
  createdAt: string;
  adminDashboardUrl: string | null;
}): string {
  const {
    messageId,
    name,
    email,
    phone,
    queryTypeDisplay,
    serviceType,
    message,
    createdAt,
    adminDashboardUrl,
  } = params;

  const dashboardAction = adminDashboardUrl
    ? `
      <tr>
        <td style="padding: 0 28px 26px;">
          <a href="${adminDashboardUrl}" style="display:inline-block; background:#b89a5e; color:#2c3340; font-weight:700; font-size:13px; text-decoration:none; padding:12px 18px; border-radius:10px;">Open Admin Inbox</a>
        </td>
      </tr>`
    : "";

  return `
<!doctype html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Bathala Enterprises - New Inquiry</title>
  </head>
  <body style="margin:0; padding:0; background:#f5f1e9; color:#1a1f2e; font-family:Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f1e9;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px; background:#ffffff; border:1px solid #e8e4dc; border-radius:14px; overflow:hidden;">
            <tr>
              <td style="background:#2c3340; padding:22px 28px 20px;">
                <p style="margin:0; color:#d4b87a; font-size:11px; letter-spacing:0.16em; font-weight:700; text-transform:uppercase;">Bathala Enterprises</p>
                <h1 style="margin:8px 0 0; color:#ffffff; font-size:22px; line-height:1.25; font-weight:700;">New Website Inquiry</h1>
                <p style="margin:8px 0 0; color:#d1d5db; font-size:12px;">Reference ID: ${messageId}</p>
              </td>
            </tr>

            <tr>
              <td style="padding:24px 28px 10px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse; border:1px solid #eee9df; border-radius:10px; overflow:hidden;">
                  <tr>
                    <td style="padding:10px 14px; font-size:12px; color:#6b7280; border-bottom:1px solid #f1eee7; width:36%;">Name</td>
                    <td style="padding:10px 14px; font-size:14px; color:#1a1f2e; border-bottom:1px solid #f1eee7;">${name}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 14px; font-size:12px; color:#6b7280; border-bottom:1px solid #f1eee7;">Email</td>
                    <td style="padding:10px 14px; font-size:14px; color:#1a1f2e; border-bottom:1px solid #f1eee7;"><a href="mailto:${email}" style="color:#2c3340; text-decoration:none; border-bottom:1px solid #d4b87a;">${email}</a></td>
                  </tr>
                  <tr>
                    <td style="padding:10px 14px; font-size:12px; color:#6b7280; border-bottom:1px solid #f1eee7;">Phone</td>
                    <td style="padding:10px 14px; font-size:14px; color:#1a1f2e; border-bottom:1px solid #f1eee7;">${phone ?? "Not provided"}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 14px; font-size:12px; color:#6b7280; border-bottom:1px solid #f1eee7;">Inquiry Type</td>
                    <td style="padding:10px 14px; font-size:14px; color:#1a1f2e; border-bottom:1px solid #f1eee7;">${queryTypeDisplay}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 14px; font-size:12px; color:#6b7280; border-bottom:1px solid #f1eee7;">Category</td>
                    <td style="padding:10px 14px; font-size:14px; color:#1a1f2e; border-bottom:1px solid #f1eee7;">${serviceType ?? "General"}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 14px; font-size:12px; color:#6b7280;">Received</td>
                    <td style="padding:10px 14px; font-size:14px; color:#1a1f2e;">${createdAt}</td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:12px 28px 24px;">
                <div style="border:1px solid #ece7de; background:#fcfbf8; border-radius:10px; padding:14px 16px;">
                  <p style="margin:0 0 8px; color:#6b7280; font-size:11px; letter-spacing:0.12em; text-transform:uppercase; font-weight:700;">Message</p>
                  <p style="margin:0; color:#1f2937; font-size:14px; line-height:1.65; white-space:pre-wrap;">${message}</p>
                </div>
              </td>
            </tr>

            ${dashboardAction}

            <tr>
              <td style="background:#f8f6f2; border-top:1px solid #ece7de; padding:14px 28px 18px;">
                <p style="margin:0; color:#8b97a9; font-size:12px;">This notification was generated from your website contact form.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildEmailText(params: {
  messageId: string;
  name: string;
  email: string;
  phone: string | null;
  queryTypeDisplay: string;
  serviceType: string | null;
  message: string;
  createdAt: string;
  adminDashboardUrl: string | null;
}): string {
  const {
    messageId,
    name,
    email,
    phone,
    queryTypeDisplay,
    serviceType,
    message,
    createdAt,
    adminDashboardUrl,
  } = params;

  const lines = [
    "Bathala Enterprises - New Website Inquiry",
    `Reference ID: ${messageId}`,
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone ?? "Not provided"}`,
    `Inquiry Type: ${queryTypeDisplay}`,
    `Category: ${serviceType ?? "General"}`,
    `Received: ${createdAt}`,
    "",
    "Message:",
    message,
  ];

  if (adminDashboardUrl) {
    lines.push("", `Admin Inbox: ${adminDashboardUrl}`);
  }

  return lines.join("\n");
}

export async function POST(request: NextRequest) {
  const requestId = createRequestId("contact");

  try {
    if (!messageStoreClient) {
      reportError(new Error("Supabase env vars are missing for contact form message storage"), {
        route: "/api/contact",
        requestId,
      });

      return apiError(
        "SERVICE_UNAVAILABLE",
        "Message service is not configured. Please contact us directly.",
        503,
        {
          requestId,
          retryable: true,
        }
      );
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const rateLimitResult = await checkServerRateLimit({
      namespace: "contact",
      key: ip,
      maxRequests: CONTACT_RATE_LIMIT_MAX,
      windowMs: CONTACT_RATE_LIMIT_WINDOW_MS,
    });
    if (!rateLimitResult.allowed) {
      return apiError(
        "RATE_LIMITED",
        "Too many requests. Please wait before trying again.",
        429,
        {
          requestId,
          retryAfterMs: rateLimitResult.retryAfterMs,
          retryable: true,
        }
      );
    }

    const body = await withTimeout(
      request.json(),
      REQUEST_BODY_TIMEOUT_MS,
      "Contact request payload timed out while parsing."
    );

    const parsedBody = contactSchema.safeParse(body);
    if (!parsedBody.success) {
      const fieldErrors = zodIssuesToFieldErrors(parsedBody.error.issues);
      return apiError("VALIDATION_ERROR", "Invalid form data. Please check your inputs.", 400, {
        requestId,
        details: "One or more form fields failed validation.",
        fieldErrors,
      });
    }

    const validatedData = parsedBody.data;
    const rawPhoneInput = typeof validatedData.phone === "string" ? validatedData.phone.trim() : null;
    const canonicalPhone = rawPhoneInput ? normalizeIndianPhone(rawPhoneInput) : null;

    if (rawPhoneInput && !canonicalPhone) {
      return apiError("VALIDATION_ERROR", "Invalid form data. Please check your inputs.", 400, {
        requestId,
        details: "Phone number must be a valid Indian mobile number.",
        fieldErrors: {
          phone: ["Enter a valid Indian mobile number (10 digits, starting with 6-9)."],
        },
      });
    }

    const sanitizedData = {
      name: sanitizeString(validatedData.name).slice(0, 100),
      email: sanitizeEmail(validatedData.email),
      phone: canonicalPhone,
      query_type: validatedData.query_type,
      service_type: validatedData.service_type ? sanitizeString(validatedData.service_type).slice(0, 200) : null,
      message: sanitizeString(validatedData.message).slice(0, 2000),
      status: "new",
      is_read: false,
    };

    const insertedMessage = await retryWithExponentialBackoff(
      async () => {
        const messageId = crypto.randomUUID();
        const createdAt = new Date().toISOString();

        const result = await withTimeout(
          messageStoreClient
            .from("messages")
            .insert({
              ...sanitizedData,
              id: messageId,
            }),
          MESSAGE_INSERT_TIMEOUT_MS,
          "Saving contact inquiry timed out."
        );

        if (result.error) {
          throw result.error;
        }

        return {
          id: messageId,
          created_at: createdAt,
        };
      },
      {
        retries: 2,
        initialDelayMs: 300,
        maxDelayMs: 1400,
        shouldRetry: (error) => isTransientNetworkError(error),
      }
    );

    const contactEmail = await resolveNotificationRecipientEmail();
    const senderEmail = process.env.SENDER_EMAIL || "onboarding@resend.dev";
    let notificationWarning: string | undefined;

    if (notificationsEnabled()) {
      if (!resend || !contactEmail) {
        notificationWarning = "Inquiry saved, but notification delivery is not configured.";
        reportError(new Error("CONTACT_EMAIL or RESEND_API_KEY is missing while notifications are enabled."), {
          route: "/api/contact",
          requestId,
          stage: "notification_configuration",
          messageId: insertedMessage.id,
        });
      } else {
        const queryTypeDisplay = sanitizedData.query_type === "services" ? "Services" : "Properties";
        const adminDashboardUrl = process.env.NEXT_PUBLIC_SITE_URL
          ? (() => {
              try {
                return new URL("/admin/messages", process.env.NEXT_PUBLIC_SITE_URL).toString();
              } catch {
                return null;
              }
            })()
          : null;
        const createdAt = new Intl.DateTimeFormat("en-IN", {
          timeZone: "Asia/Kolkata",
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(insertedMessage.created_at || Date.now()));

        try {
          await retryWithExponentialBackoff(
            async () => {
              const emailResult = await withTimeout(
                resend.emails.send({
                  from: `Bathala Enterprises <${senderEmail}>`,
                  to: contactEmail,
                  replyTo: sanitizedData.email,
                  subject: `New ${queryTypeDisplay} Inquiry from ${sanitizedData.name}`,
                  html: buildEmailHtml({
                    messageId: insertedMessage.id,
                    name: sanitizedData.name,
                    email: sanitizedData.email,
                    phone: sanitizedData.phone,
                    queryTypeDisplay,
                    serviceType: sanitizedData.service_type,
                    message: sanitizedData.message,
                    createdAt,
                    adminDashboardUrl,
                  }),
                  text: buildEmailText({
                    messageId: insertedMessage.id,
                    name: sanitizedData.name,
                    email: sanitizedData.email,
                    phone: sanitizedData.phone,
                    queryTypeDisplay,
                    serviceType: sanitizedData.service_type,
                    message: sanitizedData.message,
                    createdAt,
                    adminDashboardUrl,
                  }),
                }),
                EMAIL_SEND_TIMEOUT_MS,
                "Notification email timed out."
              );

              if (emailResult.error) {
                throw new Error(emailResult.error.message || "Resend notification failed.");
              }
            },
            {
              retries: 2,
              initialDelayMs: 300,
              maxDelayMs: 1600,
              shouldRetry: (error) => isTransientNetworkError(error),
            }
          );
        } catch (emailError) {
          const emailErrorMessage = getErrorMessage(emailError);
          const isResendTestingRestriction = emailErrorMessage
            .toLowerCase()
            .includes("you can only send testing emails to your own email address");

          notificationWarning = isResendTestingRestriction
            ? "Inquiry saved, but Resend testing mode only sends to your Resend account inbox. Without a domain, set CONTACT_EMAIL to that same inbox. With a domain, verify it in Resend and set SENDER_EMAIL to that domain."
            : "Inquiry saved, but notification delivery is delayed.";

          reportError(emailError, {
            route: "/api/contact",
            requestId,
            stage: "send_notification_email",
            messageId: insertedMessage.id,
            emailErrorMessage,
          });
        }
      }
    }

    return apiSuccess(
      {
        message: "Inquiry submitted successfully.",
        messageId: insertedMessage.id,
        submittedAt: insertedMessage.created_at,
        warning: notificationWarning,
      },
      {
        requestId,
        extra: {
          message: "Inquiry submitted successfully.",
          messageId: insertedMessage.id,
        },
      }
    );
  } catch (error) {
    if (error instanceof TimeoutError) {
      return apiError(
        "REQUEST_TIMEOUT",
        "Request timed out. Please try again.",
        504,
        {
          requestId,
          retryable: true,
        }
      );
    }

    if (isRlsPolicyError(error)) {
      const supabaseError = getSupabaseErrorInfo(error);

      reportError(error, {
        route: "/api/contact",
        requestId,
        stage: "rls_policy_check",
        dbCode: supabaseError.code,
        dbMessage: supabaseError.message,
        dbDetails: supabaseError.details,
        remediation:
          "Database policy blocks inserts to public.messages. Run SUPABASE_FIX_MESSAGES_RLS.sql or configure SUPABASE_SERVICE_ROLE_KEY.",
      });

      return apiError(
        "SERVICE_UNAVAILABLE",
        "Inquiry service is temporarily unavailable. Please contact us directly while we restore it.",
        503,
        {
          requestId,
        }
      );
    }

    reportError(error, {
      route: "/api/contact",
      requestId,
      stage: "post_handler",
    });

    if (isTransientNetworkError(error)) {
      return apiError(
        "SERVICE_UNAVAILABLE",
        "Service is temporarily unavailable. Please retry shortly.",
        503,
        {
          requestId,
          retryable: true,
        }
      );
    }

    return apiError("INTERNAL_ERROR", "An unexpected error occurred. Please try again.", 500, {
      requestId,
    });
  }
}
