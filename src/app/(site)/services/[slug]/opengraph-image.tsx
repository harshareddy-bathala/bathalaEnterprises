import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/seo";
import { getServiceBySlug } from "@/lib/supabase-queries";
import { getServiceSummary } from "@/lib/service-format";

export const alt = `Service offered by ${SITE_NAME}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: Promise<{ slug: string }> };

export default async function ServiceOpengraphImage({ params }: Props) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  const title = service?.title ?? "Property Services";
  const summary = service
    ? getServiceSummary(service, "Premium property services in Bengaluru.", 140)
    : "Premium property services in Bengaluru.";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f8f6f2",
          padding: "72px",
          borderTop: "16px solid #b89a5e",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "20px",
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#b89a5e",
          }}
        >
          <div style={{ width: "40px", height: "2px", background: "#b89a5e" }} />
          Our Services
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: "66px",
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              color: "#1a1f2e",
              maxWidth: "1000px",
            }}
          >
            {title}
          </div>
          <div
            style={{
              marginTop: "24px",
              fontSize: "28px",
              lineHeight: 1.45,
              color: "#4a5568",
              maxWidth: "900px",
            }}
          >
            {summary}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "10px",
              background: "#2c3340",
              color: "#b89a5e",
              fontSize: "28px",
              fontWeight: 700,
            }}
          >
            B
          </div>
          <div style={{ fontSize: "24px", fontWeight: 600, color: "#2c3340" }}>
            {SITE_NAME}
          </div>
        </div>
      </div>
    ),
    size
  );
}
