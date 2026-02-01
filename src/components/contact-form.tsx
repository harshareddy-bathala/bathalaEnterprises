"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sanitizeString, sanitizeEmail, checkRateLimit } from "@/lib/security";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Valid email required").max(254, "Email is too long"),
  phone: z.string().optional(),
  query_type: z.string().min(1, "Select a query type"),
  service_type: z.string().min(2, "Service details required").max(200, "Details too long"),
  message: z.string().min(10, "Message should be at least 10 characters").max(2000, "Message is too long")
});

type FormValues = z.infer<typeof schema>;

const queryTypes = [
  { label: "Select an option", value: "" },
  { label: "About Services", value: "services" },
  { label: "About Properties", value: "properties" }
];

export default function ContactForm() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error" | "rate-limited">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Get property info from URL params
  const propertyId = searchParams.get('property_id');
  const propertyTitle = searchParams.get('property_title');
  const propertyType = searchParams.get('property_type');

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      query_type: propertyId ? "properties" : "",
      service_type: propertyId ? `${propertyType} - ${propertyTitle}` : "",
      message: propertyId 
        ? `I am interested in the property: ${propertyTitle} (ID: ${propertyId}). Please provide more details.`
        : ""
    }
  });

  // Update form when URL params change
  useEffect(() => {
    if (propertyId && propertyTitle) {
      form.setValue('query_type', 'properties');
      form.setValue('service_type', `${propertyType} - ${propertyTitle}`);
      form.setValue('message', `I am interested in the property: ${propertyTitle} (ID: ${propertyId}). Please provide more details.`);
    }
  }, [propertyId, propertyTitle, propertyType, form]);

  const selectedQuery = form.watch("query_type");

  const onSubmit = async (values: FormValues) => {
    // Rate limiting check
    if (!checkRateLimit("contact-form", 3, 60000)) {
      setStatus("rate-limited");
      setErrorMessage("Too many submissions. Please wait a minute before trying again.");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      // Sanitize inputs
      const sanitizedData = {
        name: sanitizeString(values.name),
        email: sanitizeEmail(values.email),
        phone: values.phone ? sanitizeString(values.phone) : null,
        message: sanitizeString(values.message),
        service_type: sanitizeString(values.service_type),
        query_type: sanitizeString(values.query_type)
      };

      // Send email via API route
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit inquiry');
      }

      form.reset();
      setStatus("success");
      setTimeout(() => setStatus("idle"), 5000);
    } catch (err) {
      console.error("Form submission error:", err);
      setStatus("error");
      setErrorMessage("Failed to submit inquiry. Please try again or contact us directly.");
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6 shadow-xl">
      <div className="mb-6 space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-royal">Contact</p>
        <h3 className="text-2xl font-black text-slate-900">Get in touch with us</h3>
        <p className="text-slateInk">We respond within one business day.</p>
      </div>

      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        {/* Query Type Selection - Dropdown */}
        <div className="space-y-2">
          <Label htmlFor="query_type">What is your inquiry about?</Label>
          <select
            id="query_type"
            {...form.register("query_type")}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 shadow-sm transition-all focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/20"
          >
            {queryTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {form.formState.errors.query_type && (
            <p className="text-sm text-red-600">{form.formState.errors.query_type.message}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" placeholder="Alex Doe" {...form.register("name")} />
            {form.formState.errors.name && <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <Input id="email" type="email" placeholder="you@company.com" {...form.register("email")} />
            {form.formState.errors.email && <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>}
          </div>
        </div>

        {selectedQuery && (
          <div className="space-y-2">
            <Label htmlFor="service_type">
              {selectedQuery === "services" ? "Which service interests you?" : "What type of property?"}
            </Label>
            <Input
              id="service_type"
              placeholder={selectedQuery === "services" ? "e.g., Security, Maintenance, Advisory" : "e.g., Rent, Lease, Sale"}
              {...form.register("service_type")}
            />
            {form.formState.errors.service_type && <p className="text-sm text-red-600">{form.formState.errors.service_type.message}</p>}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea 
            id="message" 
            placeholder="Tell us more about your requirements" 
            {...form.register("message")} 
            maxLength={2000}
          />
          {form.formState.errors.message && <p className="text-sm text-red-600">{form.formState.errors.message.message}</p>}
        </div>

        <div className="flex flex-col gap-3">
          <Button type="submit" disabled={status === "submitting"} className="gap-2">
            {status === "submitting" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send inquiry"
            )}
          </Button>
          
          {status === "success" && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700">Inquiry submitted successfully. We'll respond within 24 hours.</span>
            </div>
          )}
          
          {(status === "error" || status === "rate-limited") && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">{errorMessage}</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}