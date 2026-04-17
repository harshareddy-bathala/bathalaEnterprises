"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { signInAdmin } from "@/lib/admin-auth";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters")
});

type FormValues = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" }
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const hasSensitiveParams = params.has("email") || params.has("password");

    if (!hasSensitiveParams) {
      return;
    }

    params.delete("email");
    params.delete("password");

    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    window.history.replaceState({}, "", nextUrl);
  }, [pathname]);

  const onSubmit = async (values: FormValues) => {
    setStatus("loading");
    setErrorMessage("");

    try {
      await signInAdmin(values.email, values.password);
      setStatus("success");
      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 500);
    } catch (error) {
      setStatus("error");
      const message = error instanceof Error ? error.message : "Authentication failed";
      setErrorMessage(message === "Invalid login credentials" ? "Invalid email or password" : message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-6 sm:py-10 md:px-8">
      <div className="bathala-panel-strong grid w-full max-w-md overflow-hidden lg:max-w-5xl lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="relative hidden overflow-hidden bg-[var(--color-slate-primary)] p-8 text-white md:p-10 lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,184,122,0.22),transparent_50%)]" />
          <div className="relative space-y-8">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-gold-light)]">Bathala Enterprises</p>
              <h1 className="headline-display text-4xl leading-tight md:text-5xl">Admin Control Center</h1>
              <p className="max-w-sm text-sm leading-relaxed text-slate-200">
                Manage premium listings, service catalogs, and publishing workflows with secure internal access.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-white/20 bg-white/5 p-3">
                <p className="text-lg font-semibold text-white">50+</p>
                <p className="text-xs uppercase tracking-wide text-slate-300">Active listings</p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/5 p-3">
                <p className="text-lg font-semibold text-white">2014</p>
                <p className="text-xs uppercase tracking-wide text-slate-300">Since</p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/5 p-3">
                <p className="text-lg font-semibold text-white">24/7</p>
                <p className="text-xs uppercase tracking-wide text-slate-300">Ops</p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-200">
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-[var(--color-gold-light)]">verified_user</span>
                Role-based secured session management
              </p>
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-[var(--color-gold-light)]">home_work</span>
                Real-time property portfolio operations
              </p>
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-[var(--color-gold-light)]">inventory_2</span>
                Structured media and listing governance
              </p>
            </div>
          </div>
        </aside>

        <div className="mx-auto w-full max-w-[460px] bg-[var(--color-surface)] p-6 sm:p-8 md:p-10 lg:max-w-none">
          <div className="mb-4 flex items-center gap-2 lg:hidden">
            <span className="h-[1.5px] w-6 rounded-[2px] bg-[var(--color-gold-accent)]" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-gold-accent)]">Bathala Admin</p>
          </div>

          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1 rounded-full border border-[#e8e4dc] bg-[#fcfbf8] px-3 py-1.5 text-xs font-semibold text-[#6b7280] transition-colors hover:border-[#d8cfbe] hover:text-[#2c3340]"
            >
              <span className="material-symbols-outlined text-[15px]">arrow_back</span>
              Back to Home
            </Link>
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-slate-secondary)]">Admin Access</p>
          <h2 className="headline-display mt-2 text-3xl leading-tight text-[var(--color-text-primary)] md:text-4xl">Secure Sign In</h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Use your authorized Bathala admin credentials.</p>

          <form method="post" onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[11px] tracking-[0.18em] text-[var(--color-slate-secondary)]">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@bathala.com"
                autoComplete="email"
                autoFocus
                className="border-[var(--color-border)] bg-[#fcfbf8] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus-visible:border-primary focus-visible:ring-primary"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-700">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[11px] tracking-[0.18em] text-[var(--color-slate-secondary)]">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="border-[var(--color-border)] bg-[#fcfbf8] pr-[70px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus-visible:border-primary focus-visible:ring-primary"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[var(--color-text-muted)] transition-colors hover:bg-black/5 hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold-accent)]"
                  aria-label={showPassword ? "Hide password" : "View password"}
                  aria-pressed={showPassword}
                >
                  <span className="material-symbols-outlined text-[18px]">{showPassword ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-red-700">{form.formState.errors.password.message}</p>
              )}
            </div>

            {status === "error" && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                <span className="material-symbols-outlined text-lg text-red-700">error</span>
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            )}

            {status === "success" && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <span className="material-symbols-outlined text-lg text-emerald-700">check_circle</span>
                <p className="text-sm text-emerald-700">Login successful! Redirecting...</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={status === "loading" || status === "success"}
              className="w-full bg-primary text-[var(--color-slate-primary)] shadow-brand-gold hover:bg-primary-hover"
            >
              {status === "loading" ? (
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                  Signing in...
                </span>
              ) : status === "success" ? "Success!" : "Sign In"}
            </Button>

            <p className="pt-2 text-center text-xs text-[var(--color-text-muted)]">
              Need access? Reach operations at
              {" "}
              <a href="mailto:hello@bathala.in" className="bathala-outline-link">hello@bathala.in</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}