import fs from "node:fs";
import path from "node:path";

const workspaceRoot = process.cwd();

function loadEnvFromFile(fileName) {
  const filePath = path.join(workspaceRoot, fileName);
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf-8").split(/\r?\n/);
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

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFromFile(".env.local");
loadEnvFromFile(".env");

async function runCheck(name, url, options = {}) {
  const startedAt = Date.now();

  try {
    const response = await fetch(url, options);
    const latencyMs = Date.now() - startedAt;

    if (!response.ok) {
      return {
        name,
        ok: false,
        message: `${response.status} ${response.statusText}`,
        latencyMs,
      };
    }

    return {
      name,
      ok: true,
      message: "reachable",
      latencyMs,
    };
  } catch (error) {
    return {
      name,
      ok: false,
      message: error instanceof Error ? error.message : String(error),
      latencyMs: Date.now() - startedAt,
    };
  }
}

const checks = [];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  checks.push({ name: "supabase", ok: false, message: "Supabase env vars missing", latencyMs: 0, critical: true });
} else {
  checks.push({
    ...(await runCheck("supabase", `${supabaseUrl}/auth/v1/health`, {
      headers: { apikey: supabaseKey },
    })),
    critical: true,
  });
}

const googleAiKey = process.env.GOOGLE_AI_API_KEY;
if (!googleAiKey) {
  checks.push({ name: "google-ai", ok: false, message: "GOOGLE_AI_API_KEY missing", latencyMs: 0, critical: true });
} else {
  checks.push({
    ...(await runCheck(
      "google-ai",
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(googleAiKey)}`
    )),
    critical: true,
  });
}

const notificationsEnabled = (process.env.CONTACT_EMAIL_NOTIFICATIONS || "true").toLowerCase() !== "false";
if (!notificationsEnabled) {
  checks.push({ name: "resend", ok: true, message: "notifications disabled", latencyMs: 0, critical: false });
} else if (!process.env.RESEND_API_KEY) {
  checks.push({ name: "resend", ok: false, message: "RESEND_API_KEY missing", latencyMs: 0, critical: true });
} else {
  checks.push({
    ...(await runCheck("resend", "https://api.resend.com/domains", {
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
    })),
    critical: true,
  });
}

console.log("Predeploy External API Connectivity");
console.log("-----------------------------------");
for (const check of checks) {
  console.log(`${check.ok ? "PASS" : "FAIL"} ${check.name} (${check.latencyMs}ms) - ${check.message}`);
}

const failedCriticalChecks = checks.filter((check) => !check.ok && check.critical);
if (failedCriticalChecks.length > 0) {
  console.error("\nExternal API connectivity failed for critical services.");
  process.exit(1);
}

console.log("\nExternal API connectivity checks passed.");
