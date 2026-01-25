"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signInAdmin } from "@/lib/admin-auth";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters")
});

type FormValues = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" }
  });

  const onSubmit = async (values: FormValues) => {
    setStatus("loading");
    setErrorMessage("");

    try {
      // Authenticate with Supabase
      await signInAdmin(values.email, values.password);
      // Store auth in localStorage
      localStorage.setItem("admin_auth", "true");
      localStorage.setItem("admin_email", values.email);
      setStatus("success");
      
      // Redirect to dashboard
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple/5 via-white to-white/80 py-12 px-4">
      <Card className="w-full max-w-md border border-white/70">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-royal/10 text-royal">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle>Admin Console</CardTitle>
          <CardDescription>Secure access for Bathala administrators.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@bathala.com"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
              )}
            </div>

            {status === "error" && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            )}

            {status === "success" && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                <p className="text-sm text-green-700">Login successful! Redirecting...</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={status === "loading" || status === "success"}
              className="w-full bg-gradient-to-r from-royal to-purple"
            >
              {status === "loading" ? "Signing in..." : status === "success" ? "Success!" : "Sign In"}
            </Button>
            
          </form>
        </CardContent>
      </Card>
    </div>
  );
}