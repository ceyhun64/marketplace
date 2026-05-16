// app/opengraph-image.tsx — Varsayılan Open Graph görseli
// Tüm sayfalar kendi og:image tanımlamadığında bu kullanılır.
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "BAZR — Marketplace & Fulfillment";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-end",
        background: "#1a1a1a",
        padding: "64px",
        position: "relative",
        overflow: "hidden",
        fontFamily: "sans-serif",
      }}
    >
      {/* Background decoration circles */}
      <div
        style={{
          position: "absolute",
          top: -60,
          right: -60,
          width: 340,
          height: 340,
          borderRadius: "50%",
          border: "50px solid rgba(200,16,46,0.12)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -80,
          left: 200,
          width: 220,
          height: 220,
          borderRadius: "50%",
          border: "30px solid rgba(255,255,255,0.04)",
        }}
      />

      {/* Top badge */}
      <div
        style={{
          position: "absolute",
          top: 64,
          left: 64,
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "rgba(200,16,46,0.15)",
          padding: "8px 16px",
          borderRadius: 8,
          border: "1px solid rgba(200,16,46,0.3)",
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#c8102e",
          }}
        />
        <span
          style={{
            fontSize: 13,
            letterSpacing: 3,
            color: "#c8102e",
            textTransform: "uppercase",
          }}
        >
          Multi-tenant Marketplace
        </span>
      </div>

      {/* Logo / Brand */}
      <div
        style={{
          fontSize: 96,
          fontWeight: 300,
          color: "#ffffff",
          letterSpacing: "-4px",
          lineHeight: 1,
          marginBottom: 16,
        }}
      >
        BAZR
      </div>

      {/* Tagline */}
      <div
        style={{
          fontSize: 28,
          color: "#888888",
          fontWeight: 400,
          marginBottom: 40,
          maxWidth: 600,
          lineHeight: 1.4,
        }}
      >
        Thousands of Sellers.
        <span style={{ color: "#ffffff" }}> One Platform.</span>
      </div>

      {/* Bottom strip */}
      <div
        style={{
          display: "flex",
          gap: 24,
          alignItems: "center",
        }}
      >
        {["Products", "Brands", "Flash Sales", "Fulfillment"].map((label) => (
          <div
            key={label}
            style={{
              fontSize: 13,
              color: "#555555",
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Red accent line */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "40%",
          height: 4,
          background: "#c8102e",
        }}
      />
    </div>,
    { ...size },
  );
}
