const baseUrl = (process.env.PREDEPLOY_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";

console.log("Predeploy Analytics Verification");
console.log("--------------------------------");
console.log(`Base URL: ${baseUrl}`);

let hasFailure = false;

try {
  const homepageResponse = await fetch(`${baseUrl}/`, { method: "GET" });
  if (!homepageResponse.ok) {
    console.error(`FAIL homepage request returned ${homepageResponse.status}`);
    hasFailure = true;
  } else {
    const html = await homepageResponse.text();

    if (measurementId) {
      const hasGaScriptReference =
        html.includes("googletagmanager.com/gtag/js") || html.includes(measurementId);
      if (hasGaScriptReference) {
        console.log("PASS GA script reference detected in rendered HTML.");
      } else {
        console.warn("WARN GA measurement ID is set but script reference was not found in initial HTML.");
      }
    } else {
      console.warn("WARN NEXT_PUBLIC_GA_MEASUREMENT_ID is not set; GA tracking is disabled.");
    }
  }
} catch (error) {
  console.error("FAIL unable to request homepage:", error instanceof Error ? error.message : String(error));
  hasFailure = true;
}

try {
  const rumPayload = {
    name: "TTFB",
    value: 123,
    rating: "good",
    path: "/predeploy-check",
    source: "web-vitals",
    timestamp: new Date().toISOString(),
    userAgent: "predeploy-checker",
  };

  const rumResponse = await fetch(`${baseUrl}/api/rum`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(rumPayload),
  });

  if (!rumResponse.ok) {
    console.error(`FAIL RUM endpoint returned ${rumResponse.status}`);
    hasFailure = true;
  } else {
    console.log("PASS RUM endpoint accepted metric payload.");
  }
} catch (error) {
  console.error("FAIL unable to verify RUM endpoint:", error instanceof Error ? error.message : String(error));
  hasFailure = true;
}

if (hasFailure) {
  process.exit(1);
}

console.log("Analytics verification completed.");
