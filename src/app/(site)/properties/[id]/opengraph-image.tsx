import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/seo";
import { formatNumber } from "@/lib/format";
import { displayPrice, prettyType, priceSuffix } from "@/lib/property-format";
import { getPropertyById } from "@/lib/supabase-queries";

export const alt = `Property listing at ${SITE_NAME}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: Promise<{ id: string }> };

export default async function PropertyOpengraphImage({ params }: Props) {
  const { id } = await params;
  const property = await getPropertyById(id);

  const title = property?.title ?? "Property Listing";
  const location = property?.location ?? "Electronic City, Bengaluru";
  // `currencyMode: "code"` renders "INR " instead of the rupee glyph — the
  // default ImageResponse font has no guaranteed coverage for U+20B9.
  const price = property
    ? `${displayPrice(property.type, property.price, { currencyMode: "code" })} ${priceSuffix(property.type)}`
    : "";
  const badge = property ? prettyType(property.type) : "Bengaluru Real Estate";
  const photo = property?.image_url || property?.thumbnail_url || null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background: "linear-gradient(135deg, #2c3340 0%, #1a1f2e 100%)",
          position: "relative",
        }}
      >
        {photo ? (
          <img
            src={photo}
            alt=""
            width={size.width}
            height={size.height}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : null}

        {/* Scrim so the text stays legible over any photo */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(180deg, rgba(20,22,30,0.35) 0%, rgba(20,22,30,0.55) 45%, rgba(20,22,30,0.92) 100%)",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            padding: "64px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                borderRadius: "999px",
                background: "#b89a5e",
                color: "#1a1f2e",
                padding: "8px 20px",
                fontSize: "20px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {badge}
            </div>
            <div style={{ fontSize: "22px", color: "rgba(255,255,255,0.82)" }}>
              {location}
            </div>
          </div>

          <div
            style={{
              marginTop: "20px",
              fontSize: "60px",
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              color: "#ffffff",
              maxWidth: "1000px",
            }}
          >
            {title}
          </div>

          <div
            style={{
              marginTop: "24px",
              display: "flex",
              alignItems: "center",
              gap: "28px",
              fontSize: "26px",
              color: "rgba(255,255,255,0.88)",
            }}
          >
            {price ? (
              <div style={{ fontWeight: 700, color: "#d4b87a" }}>{price}</div>
            ) : null}
            {property ? (
              <div style={{ display: "flex", gap: "28px" }}>
                <div>{property.bedrooms} Bed</div>
                <div>{formatNumber(property.sqft)} sq.ft.</div>
              </div>
            ) : null}
          </div>

          <div
            style={{
              marginTop: "30px",
              fontSize: "22px",
              fontWeight: 600,
              letterSpacing: "0.04em",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            {SITE_NAME}
          </div>
        </div>
      </div>
    ),
    size
  );
}
