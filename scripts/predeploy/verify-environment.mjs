import fs from "node:fs";
import path from "node:path";

const workspaceRoot = process.cwd();

const envFiles = [".env.local", ".env"].map((name) => path.join(workspaceRoot, name));

function parseEnvFile(content) {
  const values = {};
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (key) {
      values[key] = value;
    }
  }

  return values;
}

for (const filePath of envFiles) {
  if (!fs.existsSync(filePath)) {
    continue;
  }

  const parsed = parseEnvFile(fs.readFileSync(filePath, "utf-8"));
  for (const [key, value] of Object.entries(parsed)) {
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

const requiredVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SITE_URL",
  "GOOGLE_AI_API_KEY",
];

const monitoringVars = [
  "NEXT_PUBLIC_GA_MEASUREMENT_ID",
  "NEXT_PUBLIC_ENABLE_RUM",
  "ERROR_TRACKING_WEBHOOK_URL",
  "LOG_INGEST_URL",
  "RUM_INGEST_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_SUPABASE_SERVICE_ROLE_KEY",
];

const failures = [];
const warnings = [];

function assertPresent(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    failures.push(`${name} is missing.`);
  }
}

for (const variableName of requiredVars) {
  assertPresent(variableName);
}

const contactEmailNotificationsEnabled = (process.env.CONTACT_EMAIL_NOTIFICATIONS || "true").toLowerCase() !== "false";
if (contactEmailNotificationsEnabled) {
  ["RESEND_API_KEY", "CONTACT_EMAIL", "SENDER_EMAIL"].forEach((variableName) => {
    const value = process.env[variableName];
    if (!value || !value.trim()) {
      failures.push(`${variableName} is required when CONTACT_EMAIL_NOTIFICATIONS is enabled.`);
    }
  });
}

const hasServiceRoleKey =
  (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.trim()) ||
  (process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY.trim());

if (!hasServiceRoleKey) {
  warnings.push(
    "SUPABASE_SERVICE_ROLE_KEY/NEXT_SUPABASE_SERVICE_ROLE_KEY is not set. Contact submissions depend on public.messages RLS insert policy unless a service-role key is configured."
  );
}

function isValidUrl(rawValue) {
  try {
    const parsed = new URL(rawValue);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
if (siteUrl && !isValidUrl(siteUrl)) {
  failures.push("NEXT_PUBLIC_SITE_URL must be a valid URL.");
}

if (siteUrl && isValidUrl(siteUrl)) {
  const parsed = new URL(siteUrl);
  if (parsed.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(parsed.hostname)) {
    failures.push("NEXT_PUBLIC_SITE_URL must use HTTPS for production domains.");
  }

  if (parsed.hostname.includes("example.com")) {
    warnings.push("NEXT_PUBLIC_SITE_URL still points to example.com; replace before deployment.");
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (supabaseUrl && !isValidUrl(supabaseUrl)) {
  failures.push("NEXT_PUBLIC_SUPABASE_URL must be a valid URL.");
}

console.log("Predeploy Environment Verification");
console.log("----------------------------------");
for (const variableName of requiredVars) {
  const value = process.env[variableName];
  console.log(`${value ? "PASS" : "FAIL"} ${variableName}`);
}

for (const variableName of monitoringVars) {
  const value = process.env[variableName];
  console.log(`${value ? "SET" : "UNSET"} ${variableName}`);
}

if (warnings.length > 0) {
  console.log("\nWarnings:");
  for (const warning of warnings) {
    console.log(`- ${warning}`);
  }
}

if (failures.length > 0) {
  console.error("\nEnvironment verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("\nEnvironment verification passed.");
