import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/seo";

export const alt = `${SITE_NAME} — Premium Real Estate Services in Bengaluru`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #2c3340 0%, #1a1f2e 100%)",
          padding: "72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "12px",
              background: "#b89a5e",
              color: "#1a1f2e",
              fontSize: "34px",
              fontWeight: 700,
            }}
          >
            B
          </div>
          <div
            style={{
              fontSize: "26px",
              fontWeight: 600,
              color: "#f8f6f2",
              letterSpacing: "-0.01em",
            }}
          >
            {SITE_NAME}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
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
            Bengaluru Real Estate
          </div>
          <div
            style={{
              marginTop: "20px",
              fontSize: "68px",
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              color: "#ffffff",
              maxWidth: "900px",
            }}
          >
            Premium property services in Electronic City
          </div>
          <div
            style={{
              marginTop: "22px",
              fontSize: "28px",
              lineHeight: 1.4,
              color: "rgba(248,246,242,0.72)",
              maxWidth: "820px",
            }}
          >
            Rentals, leasing, sales and property management. Building trust, one
            property at a time.
          </div>
        </div>
      </div>
    ),
    size
  );
}
