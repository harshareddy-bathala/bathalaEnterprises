const baseUrl = process.env.PREDEPLOY_BASE_URL || "http://127.0.0.1:3000";
const endpoint = `${baseUrl.replace(/\/$/, "")}/api/contact`;

const payload = {
  name: "Predeploy Delivery Check",
  email: process.env.PREDEPLOY_TEST_CONTACT_EMAIL || "qa@bathala.local",
  phone: "+919999999999",
  query_type: "services",
  service_type: "Deployment Validation",
  message: `Predeploy contact delivery check at ${new Date().toISOString()}`,
};

console.log("Predeploy Contact Delivery Check");
console.log("--------------------------------");
console.log(`Endpoint: ${endpoint}`);

try {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Predeploy-Validation": "contact-email-delivery",
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    console.error(`FAIL contact API returned ${response.status}`);
    if (body) {
      console.error(JSON.stringify(body, null, 2));
    }

    const detailText = [
      body?.error?.details,
      body?.error?.message,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (
      detailText.includes("row-level security") ||
      detailText.includes("public.messages") ||
      detailText.includes("policy blocks inserts")
    ) {
      console.error(
        "HINT Contact DB policy issue detected. Run SUPABASE_FIX_MESSAGES_RLS.sql in Supabase SQL Editor or set SUPABASE_SERVICE_ROLE_KEY."
      );
    }

    process.exit(1);
  }

  if (!body?.success) {
    console.error("FAIL contact API did not return success payload.");
    console.error(JSON.stringify(body, null, 2));
    process.exit(1);
  }

  console.log("PASS contact request accepted.");
  console.log(`Message ID: ${body?.data?.messageId || "unknown"}`);

  if (body?.data?.warning) {
    console.warn(`WARN ${body.data.warning}`);
  }
} catch (error) {
  console.error("FAIL contact delivery test failed:", error instanceof Error ? error.message : String(error));
  process.exit(1);
}
