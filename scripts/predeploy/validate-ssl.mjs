import fs from "node:fs";
import path from "node:path";
import tls from "node:tls";

const workspaceRoot = process.cwd();

function loadEnv(fileName) {
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

    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnv(".env.local");
loadEnv(".env");

const siteUrlRaw = process.env.NEXT_PUBLIC_SITE_URL;
if (!siteUrlRaw) {
  console.error("NEXT_PUBLIC_SITE_URL is not set.");
  process.exit(1);
}

let siteUrl;
try {
  siteUrl = new URL(siteUrlRaw);
} catch {
  console.error("NEXT_PUBLIC_SITE_URL must be a valid URL.");
  process.exit(1);
}

if (siteUrl.protocol !== "https:") {
  if (["localhost", "127.0.0.1"].includes(siteUrl.hostname)) {
    console.log("Skipping SSL validation for local URL.");
    process.exit(0);
  }

  console.error("NEXT_PUBLIC_SITE_URL must use HTTPS for SSL validation.");
  process.exit(1);
}

const minimumDaysRemaining = Number(process.env.SSL_MIN_DAYS || 14);

function getCertificate(hostname, port = 443) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(
      {
        host: hostname,
        port,
        servername: hostname,
        rejectUnauthorized: true,
      },
      () => {
        const certificate = socket.getPeerCertificate(true);
        socket.end();
        resolve(certificate);
      }
    );

    socket.setTimeout(10_000, () => {
      socket.destroy();
      reject(new Error("TLS handshake timed out."));
    });

    socket.on("error", (error) => {
      reject(error);
    });
  });
}

try {
  const certificate = await getCertificate(siteUrl.hostname);

  if (!certificate || !certificate.valid_to) {
    throw new Error("Unable to read certificate details.");
  }

  const validTo = new Date(certificate.valid_to);
  const validFrom = new Date(certificate.valid_from);
  const now = new Date();

  const daysRemaining = Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isExpired = validTo.getTime() <= now.getTime();
  const notYetValid = validFrom.getTime() > now.getTime();

  console.log("SSL Certificate Validation");
  console.log("--------------------------");
  console.log(`Host: ${siteUrl.hostname}`);
  console.log(`Issuer: ${certificate.issuer?.O || "Unknown"}`);
  console.log(`Valid From: ${validFrom.toISOString()}`);
  console.log(`Valid To: ${validTo.toISOString()}`);
  console.log(`Days Remaining: ${daysRemaining}`);

  if (notYetValid) {
    console.error("Certificate is not yet valid.");
    process.exit(1);
  }

  if (isExpired) {
    console.error("Certificate has expired.");
    process.exit(1);
  }

  if (daysRemaining < minimumDaysRemaining) {
    console.error(`Certificate expires in less than ${minimumDaysRemaining} days.`);
    process.exit(1);
  }

  console.log("SSL validation passed.");
} catch (error) {
  console.error("SSL validation failed:", error instanceof Error ? error.message : String(error));
  process.exit(1);
}
