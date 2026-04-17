"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  fetchWithTimeout,
  isTransientNetworkError,
  retryWithExponentialBackoff,
  TimeoutError,
} from "@/lib/async-utils";
import { checkRateLimit, isValidIndianPhone, sanitizeEmail, sanitizeString } from "@/lib/security";
import AnimatedCheckmark from "@/components/ui/animated-checkmark";
import Toast from "@/components/ui/toast";

const schema = z.object({
  name: z.string().min(2, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Valid email required").max(254, "Email is too long"),
  phone: z
    .string()
    .min(10, "Phone number is required")
    .max(20, "Phone number is too long")
    .refine((value) => isValidIndianPhone(value), "Enter a valid Indian phone number"),
  query_type: z.string().min(1, "Select a query type"),
  service_type: z.string().min(1, "Select a property type"),
  message: z.string().min(10, "Message should be at least 10 characters").max(2000, "Message is too long")
});

type FormValues = z.infer<typeof schema>;

type ContactApiMeta = {
  requestId?: string;
  retryAfterMs?: number;
};

type ContactApiSuccess = {
  success: true;
  data: {
    message: string;
    messageId?: string;
    submittedAt?: string;
    warning?: string;
  };
  meta?: ContactApiMeta;
  message?: string;
  messageId?: string;
};

type ContactApiError = {
  success: false;
  error?: {
    message?: string;
    fieldErrors?: Record<string, string[]>;
  };
  meta?: ContactApiMeta;
};

type ContactApiResponse = ContactApiSuccess | ContactApiError;

type ContactSubmissionPayload = {
  name: string;
  email: string;
  phone: string;
  message: string;
  service_type: string;
  query_type: string;
};

const queryTypes = [
  { label: "Select an option", value: "" },
  { label: "Property Search", value: "properties" },
  { label: "Service Assistance", value: "services" }
];

const propertyTypesByQuery: Record<string, { label: string; value: string }[]> = {
  properties: [
    { label: "Select", value: "" },
    { label: "Rent", value: "Rent" },
    { label: "Lease", value: "Lease" },
    { label: "Sale", value: "Sale" },
  ],
  services: [
    { label: "Select", value: "" },
    { label: "Maintenance", value: "Maintenance" },
    { label: "Advisory", value: "Advisory" },
    { label: "Tenant Support", value: "Tenant Support" },
    { label: "Property Management", value: "Property Management" },
  ],
};

const labelClass = "text-[12px] font-semibold tracking-[0.01em] text-[#374151]";
const fieldClass =
  "h-[49px] w-full rounded-[10px] border border-[#e8e4dc] bg-[#fafaf9] px-[15px] text-[14px] text-[#1a1f2e] placeholder:text-[rgba(26,31,46,0.5)] outline-none transition focus:border-[#b89a5e] focus:ring-2 focus:ring-[rgba(184,154,94,0.18)]";
const textareaClass =
  "min-h-[132px] w-full rounded-[10px] border border-[#e8e4dc] bg-[#fafaf9] px-[15px] py-[12px] text-[14px] leading-[1.6] text-[#1a1f2e] placeholder:text-[rgba(26,31,46,0.5)] outline-none transition focus:border-[#b89a5e] focus:ring-2 focus:ring-[rgba(184,154,94,0.18)]";

type ContactFormProps = {
  initialPropertyId?: string;
  initialPropertyTitle?: string;
  initialPropertyType?: string;
  initialQueryType?: "properties" | "services";
  initialServiceType?: string;
};

function buildPropertyPrefillMessage(propertyTitle: string, propertyId: string) {
  return `I am interested in the property: ${propertyTitle} (ID: ${propertyId}). Please provide more details.`;
}

function buildServicePrefillMessage(serviceType: string) {
  return `I am interested in the ${serviceType} service. Please share the next steps and pricing details.`;
}

export default function ContactForm({
  initialPropertyId,
  initialPropertyTitle,
  initialPropertyType,
  initialQueryType,
  initialServiceType,
}: ContactFormProps) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error" | "rate-limited">("idle");
  const [isHydrated, setIsHydrated] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [submissionWarning, setSubmissionWarning] = useState<string | null>(null);
  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string[]>>({});
  const [retryAfterMs, setRetryAfterMs] = useState<number>(0);
  const [lastPayload, setLastPayload] = useState<ContactSubmissionPayload | null>(null);
  const prefillKeyRef = useRef<string>("");
  const urlPrefillAppliedRef = useRef(false);

  const propertyId = initialPropertyId || null;
  const propertyTitle = initialPropertyTitle || null;
  const propertyType = initialPropertyType || null;
  const normalizedInitialQueryType =
    initialQueryType === "properties" || initialQueryType === "services"
      ? initialQueryType
      : undefined;
  const normalizedInitialServiceType = initialServiceType?.trim() || "";
  const hasPropertyPrefill = Boolean(propertyId && propertyTitle);
  const hasServicePrefill =
    !hasPropertyPrefill &&
    normalizedInitialQueryType === "services" &&
    normalizedInitialServiceType.length > 0;
  const initialQuerySelection = hasPropertyPrefill
    ? "properties"
    : normalizedInitialQueryType || "";
  const initialServiceSelection = hasPropertyPrefill
    ? propertyType || ""
    : normalizedInitialServiceType;
  const initialMessage = hasPropertyPrefill
    ? buildPropertyPrefillMessage(propertyTitle!, propertyId!)
    : hasServicePrefill
      ? buildServicePrefillMessage(normalizedInitialServiceType)
      : "";

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "+91 ",
      query_type: initialQuerySelection,
      service_type: initialServiceSelection,
      message: initialMessage,
    }
  });

  const toSummaryErrors = (errors: Record<string, string[]>) =>
    Object.entries(errors).flatMap(([field, messages]) => {
      if (!messages || messages.length === 0) {
        return [];
      }

      return `${field.replace(/_/g, " ")}: ${messages[0]}`;
    });

  const clientValidationSummary = useMemo(() => {
    return Object.entries(form.formState.errors).flatMap(([field, issue]) => {
      const message = issue?.message;
      return typeof message === "string" && message.trim().length > 0
        ? [`${field.replace(/_/g, " ")}: ${message}`]
        : [];
    });
  }, [form.formState.errors]);

  const serverValidationSummary = useMemo(
    () => toSummaryErrors(serverFieldErrors),
    [serverFieldErrors]
  );

  useEffect(() => {
    const prefillKey = propertyId && propertyTitle ? `${propertyId}:${propertyType || ""}` : "";
    if (!prefillKey) {
      return;
    }

    if (prefillKeyRef.current === prefillKey) {
      return;
    }

    prefillKeyRef.current = prefillKey;
    form.setValue("query_type", "properties", { shouldDirty: false, shouldValidate: true });
    form.setValue("service_type", propertyType || "Rent", { shouldDirty: false, shouldValidate: true });
    form.setValue(
      "message",
      buildPropertyPrefillMessage(propertyTitle!, propertyId!),
      { shouldDirty: false, shouldValidate: true }
    );
  }, [propertyId, propertyTitle, propertyType, form]);

  useEffect(() => {
    if (urlPrefillAppliedRef.current || typeof window === "undefined") {
      return;
    }

    urlPrefillAppliedRef.current = true;
    const params = new URLSearchParams(window.location.search);
    const queryTypeFromUrl = params.get("query_type");

    if (queryTypeFromUrl !== "properties" && queryTypeFromUrl !== "services") {
      return;
    }

    form.setValue("query_type", queryTypeFromUrl, {
      shouldDirty: false,
      shouldValidate: true,
    });

    const serviceTypeFromUrl = params.get("service_type")?.trim() || "";
    if (serviceTypeFromUrl.length > 0) {
      form.setValue("service_type", serviceTypeFromUrl, {
        shouldDirty: false,
        shouldValidate: true,
      });
    }

    const propertyIdFromUrl = params.get("property_id");
    const propertyTitleFromUrl = params.get("property_title");
    if (queryTypeFromUrl === "properties" && propertyIdFromUrl && propertyTitleFromUrl) {
      form.setValue(
        "message",
        buildPropertyPrefillMessage(propertyTitleFromUrl, propertyIdFromUrl),
        { shouldDirty: false, shouldValidate: true }
      );
      return;
    }

    if (queryTypeFromUrl === "services" && serviceTypeFromUrl.length > 0 && !form.getValues("message")) {
      form.setValue(
        "message",
        buildServicePrefillMessage(serviceTypeFromUrl),
        { shouldDirty: false, shouldValidate: true }
      );
    }
  }, [form]);

  const selectedQuery = form.watch("query_type");
  const selectedServiceType = form.watch("service_type");
  const [progressPct, setProgressPct] = useState(10);
  const availablePropertyTypes = useMemo(() => {
    const queryKey = selectedQuery || "properties";
    const baseOptions = [...(propertyTypesByQuery[queryKey] || propertyTypesByQuery.properties)];

    if (
      queryKey === "services" &&
      selectedServiceType &&
      !baseOptions.some((option) => option.value === selectedServiceType)
    ) {
      baseOptions.push({
        label: selectedServiceType,
        value: selectedServiceType,
      });
    }

    return baseOptions;
  }, [selectedQuery, selectedServiceType]);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (status !== "submitting") {
      return;
    }

    setProgressPct(18);
    const id = window.setInterval(() => {
      setProgressPct((value) => Math.min(92, value + 8));
    }, 160);

    return () => window.clearInterval(id);
  }, [status]);

  useEffect(() => {
    if (retryAfterMs <= 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setRetryAfterMs((value) => (value <= 1000 ? 0 : value - 1000));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [retryAfterMs]);

  useEffect(() => {
    if (propertyId || selectedQuery !== "properties") {
      return;
    }

    const allowedOptions = propertyTypesByQuery.properties || [];
    const currentServiceType = form.getValues("service_type");

    if (currentServiceType && !allowedOptions.some((option) => option.value === currentServiceType)) {
      form.setValue("service_type", "", { shouldDirty: true, shouldValidate: true });
    }
  }, [selectedQuery, propertyId, form]);

  const applyServerFieldErrors = (fieldErrors: Record<string, string[]>) => {
    setServerFieldErrors(fieldErrors);

    for (const [fieldName, messages] of Object.entries(fieldErrors)) {
      const firstMessage = messages?.[0];
      if (!firstMessage) {
        continue;
      }

      if (fieldName in form.getValues()) {
        form.setError(fieldName as keyof FormValues, {
          type: "server",
          message: firstMessage,
        });
      }
    }
  };

  const submitPayload = async (
    payload: ContactSubmissionPayload,
    options: { skipClientRateLimit?: boolean } = {}
  ) => {
    const { skipClientRateLimit = false } = options;

    if (!skipClientRateLimit && !checkRateLimit("contact-form", 3, 60000)) {
      setStatus("rate-limited");
      setErrorMessage("Too many submissions. Please wait a minute before trying again.");
      setSubmissionId(null);
      setRetryAfterMs(60_000);
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setStatus("error");
      setErrorMessage("You are offline. Reconnect and retry your submission.");
      setSubmissionId(null);
      setProgressPct(0);
      setLastPayload(payload);
      return;
    }

    setStatus("submitting");
    setErrorMessage("");
    setSubmissionWarning(null);
    setServerFieldErrors({});
    setRetryAfterMs(0);
    setLastPayload(payload);

    try {
      const response = await retryWithExponentialBackoff(
        async () =>
          fetchWithTimeout(
            "/api/contact",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            },
            12_000
          ),
        {
          retries: 1,
          initialDelayMs: 350,
          maxDelayMs: 1200,
          shouldRetry: (error) => isTransientNetworkError(error),
        }
      );

      let responseData: ContactApiResponse | null = null;
      try {
        responseData = (await response.json()) as ContactApiResponse;
      } catch {
        responseData = null;
      }

      if (!response.ok || !responseData || !responseData.success) {
        const fieldErrors = responseData?.success === false ? responseData.error?.fieldErrors || {} : {};
        const retryAfter = responseData?.meta?.retryAfterMs || 0;

        if (Object.keys(fieldErrors).length > 0) {
          applyServerFieldErrors(fieldErrors);
        }

        if (response.status === 429) {
          setStatus("rate-limited");
          setRetryAfterMs(retryAfter);
          setErrorMessage(
            retryAfter > 0
              ? `Rate limit reached. Retry in ${Math.ceil(retryAfter / 1000)} seconds.`
              : "Rate limit reached. Please wait before trying again."
          );
          return;
        }

        setStatus("error");
        setSubmissionId(null);
        setSubmissionWarning(null);
        setProgressPct(0);
        setErrorMessage(
          responseData?.success === false && responseData.error?.message
            ? responseData.error.message
            : "Failed to submit inquiry. Please try again or contact us directly."
        );
        return;
      }

      const nextSubmissionId =
        typeof responseData.data.messageId === "string"
          ? responseData.data.messageId
          : typeof responseData.messageId === "string"
            ? responseData.messageId
            : null;
      const nextSubmissionWarning =
        typeof responseData.data.warning === "string" && responseData.data.warning.trim().length > 0
          ? responseData.data.warning
          : null;

      setSubmissionId(nextSubmissionId);
      setSubmissionWarning(nextSubmissionWarning);
      setProgressPct(100);
      setServerFieldErrors({});

      form.reset({
        name: "",
        email: "",
        phone: "+91 ",
        query_type: initialQuerySelection,
        service_type: initialServiceSelection,
        message: initialMessage,
      });

      setStatus("success");
      setTimeout(() => {
        setStatus("idle");
        setSubmissionId(null);
        setSubmissionWarning(null);
      }, 7000);
    } catch (err) {
      console.error("Form submission error:", err);
      setStatus("error");
      setSubmissionId(null);
      setSubmissionWarning(null);
      setProgressPct(0);

      if (err instanceof TimeoutError) {
        setErrorMessage("Submission timed out. Please retry in a moment.");
        return;
      }

      setErrorMessage(
        isTransientNetworkError(err)
          ? "Temporary network issue. Please retry your submission."
          : "Failed to submit inquiry. Please try again or contact us directly."
      );
    }
  };

  const onSubmit = async (values: FormValues) => {
    const sanitizedData: ContactSubmissionPayload = {
      name: sanitizeString(values.name),
      email: sanitizeEmail(values.email),
      phone: sanitizeString(values.phone),
      message: sanitizeString(values.message),
      service_type: sanitizeString(values.service_type),
      query_type: sanitizeString(values.query_type),
    };

    await submitPayload(sanitizedData);
  };

  const handleRetrySubmission = async () => {
    if (!lastPayload || status === "submitting") {
      return;
    }

    await submitPayload(lastPayload, { skipClientRateLimit: true });
  };

  useEffect(() => {
    setServerFieldErrors({});
  }, [selectedQuery]);

  return (
    <div className="rounded-[24px] border border-[#ede8df] bg-white p-8 shadow-[0_8px_40px_rgba(0,0,0,0.07),0_1px_4px_rgba(0,0,0,0.04)] sm:p-10 lg:p-11">
      {status === "submitting" ? (
        <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-[#f3ede2]">
          <div
            className="h-full rounded-full bg-[#b89a5e] transition-[width] duration-150"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#b89a5e]" />
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#b89a5e]">Quick Enquiry</p>
        </div>
        <h3 className="font-display text-[32px] font-bold leading-[1.2] tracking-[-0.01em] text-[#1a1f2e]">
          Send Us a Message
        </h3>
        <p className="text-[13px] text-[#9ca3af]">No spam, no CAPTCHA - just a quick note.</p>
      </div>

      <div className="my-6 h-px w-full bg-[#f5f2ed]" />

      {clientValidationSummary.length > 0 || serverValidationSummary.length > 0 ? (
        <div className="mb-5 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2" role="alert" aria-live="polite">
          <p className="text-[12px] font-semibold text-red-700">Please correct the following:</p>
          <ul className="mt-1 space-y-1 text-[11px] text-red-700">
            {[...clientValidationSummary, ...serverValidationSummary].map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-[14px] sm:grid-cols-2">
          <div className="space-y-[6px]">
            <label htmlFor="name" className={labelClass}>
              Full Name<span className="text-[#b89a5e]">*</span>
            </label>
            <input 
              id="name" 
              className={fieldClass} 
              placeholder="e.g. Priya Nair" 
              autoComplete="name"
              autoCapitalize="words"
              {...form.register("name")} 
            />
            {form.formState.errors.name && <p className="text-[11px] text-red-500">{form.formState.errors.name.message}</p>}
          </div>

          <div className="space-y-[6px]">
            <label htmlFor="phone" className={labelClass}>
              Phone Number<span className="text-[#b89a5e]">*</span>
            </label>
            <input 
              id="phone" 
              className={fieldClass} 
              placeholder="+91 98765 43210" 
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              {...form.register("phone")} 
            />
            {form.formState.errors.phone && <p className="text-[11px] text-red-500">{form.formState.errors.phone.message}</p>}
          </div>
        </div>

        <div className="space-y-[6px]">
          <label htmlFor="email" className={labelClass}>
            Email Address<span className="text-[#b89a5e]">*</span>
          </label>
          <input 
            id="email" 
            type="email" 
            className={fieldClass} 
            placeholder="you@example.com" 
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            {...form.register("email")} 
          />
          {form.formState.errors.email && <p className="text-[11px] text-red-500">{form.formState.errors.email.message}</p>}
        </div>

        <div className="grid gap-[14px] sm:grid-cols-2">
          <div className="space-y-[6px]">
            <label htmlFor="query_type" className={labelClass}>
              Interested In<span className="text-[#b89a5e]">*</span>
            </label>
            <div className="relative">
              <select id="query_type" className={`${fieldClass} appearance-none pr-9`} {...form.register("query_type")}>
                {queryTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[14px] text-[#9ca3af]">
                expand_more
              </span>
            </div>
            {form.formState.errors.query_type && <p className="text-[11px] text-red-500">{form.formState.errors.query_type.message}</p>}
          </div>

          <div className="space-y-[6px]">
            <label htmlFor="service_type" className={labelClass}>
              {selectedQuery === "services" ? "Service Type" : "Property Type"}
            </label>
            <div className="relative">
              <select id="service_type" className={`${fieldClass} appearance-none pr-9`} {...form.register("service_type")}>
                {availablePropertyTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[14px] text-[#9ca3af]">
                expand_more
              </span>
            </div>
            {form.formState.errors.service_type && <p className="text-[11px] text-red-500">{form.formState.errors.service_type.message}</p>}
          </div>
        </div>

        <div className="space-y-[6px]">
          <label htmlFor="message" className={labelClass}>Message</label>
          <textarea
            id="message"
            className={textareaClass}
            placeholder="I'm looking for a 2BHK near Electronic City Phase 1, preferably below INR 30,000/month..."
            {...form.register("message")}
            maxLength={2000}
          />
          <p className="text-[11px] leading-[1.5] text-[#9ca3af]">
            Tell us your budget, location preference, or any specific requirements.
          </p>
          {form.formState.errors.message && <p className="text-[11px] text-red-500">{form.formState.errors.message.message}</p>}
        </div>

        <div className="space-y-3 pt-1">
          <button
            type="submit"
            disabled={status === "submitting" || !isHydrated}
            className="inline-flex h-[49px] w-full items-center justify-center gap-2 rounded-[12px] bg-[#b89a5e] text-[14px] font-semibold text-[#2c3340] shadow-[0_2px_8px_rgba(184,154,94,0.14)] transition-colors hover:bg-[#a88c52] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === "submitting" ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[15px]">progress_activity</span>
                Sending...
              </>
            ) : (
              <>
                {!isHydrated ? (
                  <span className="material-symbols-outlined animate-spin text-[15px]">progress_activity</span>
                ) : null}
                Send Enquiry
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </>
            )}
          </button>

          {status === "success" ? (
            <div className="space-y-1 rounded-[10px] border border-[#d8ead9] bg-[#f3fbf4] px-3 py-2 text-[12px] text-[#325338]">
              <p className="flex items-center gap-2 font-medium">
                <AnimatedCheckmark className="h-4 w-4" />
                Inquiry received. We typically respond within 2 hours.
              </p>
              {submissionId ? (
                <p className="pl-[14px] text-[11px] text-[#5a7a5f]">
                  Reference ID: <span className="font-semibold">{submissionId}</span>
                </p>
              ) : null}
              {submissionWarning ? (
                <p className="pl-[14px] text-[11px] text-amber-700">{submissionWarning}</p>
              ) : null}
            </div>
          ) : status === "error" || status === "rate-limited" ? (
            <div
              className="animate-error-shake space-y-3 rounded-[10px] border border-red-200 bg-red-50 px-3 py-3 text-[12px] text-red-700"
              role="alert"
              aria-live="polite"
            >
              <p className="flex items-start gap-2 font-medium leading-[1.5]">
                <span className="material-symbols-outlined mt-[1px] text-[15px]" aria-hidden="true">
                  warning
                </span>
                <span>{errorMessage || "Something went wrong. Please try again."}</span>
              </p>

              {status === "rate-limited" && retryAfterMs > 0 ? (
                <p className="pl-[22px] text-[11px] text-red-600">
                  Retry available in {Math.ceil(retryAfterMs / 1000)} seconds.
                </p>
              ) : null}

              {lastPayload ? (
                <div className="pl-[22px]">
                  <button
                    type="button"
                    onClick={handleRetrySubmission}
                    disabled={status === "rate-limited" && retryAfterMs > 0}
                    className="inline-flex h-[38px] items-center gap-1 rounded-full border border-red-200 bg-white px-4 text-[12px] font-semibold text-[#4a5568] transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-[14px]">refresh</span>
                    Retry submission
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-[12px] text-[#9ca3af]">
              <span className="h-[6px] w-[6px] rounded-[3px] bg-[#7c9a7e]" />
              <span>
                We typically respond within <span className="font-semibold text-[#6b7280]">2 hours</span>
              </span>
            </div>
          )}
        </div>
      </form>

      <Toast
        open={status === "success"}
        tone={submissionWarning ? "warning" : "success"}
        message={
          submissionWarning
            ? `Inquiry submitted. ${submissionWarning}`
            : "Inquiry submitted successfully. We will contact you shortly."
        }
        onClose={() => {
          setStatus("idle");
          setErrorMessage("");
          setSubmissionWarning(null);
        }}
      />
    </div>
  );
}