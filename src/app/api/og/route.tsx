import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "GigSafe";
  const budget = searchParams.get("budget") || "";
  const milestones = searchParams.get("milestones") || "";
  const status = searchParams.get("status") || "";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          backgroundColor: "#030712",
          padding: "60px",
        }}
      >
        {/* Logo area */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#fff",
              display: "flex",
            }}
          >
            🛡️ Gig
            <span style={{ color: "#10b981" }}>Safe</span>
          </div>
          {status && (
            <div
              style={{
                fontSize: "14px",
                color: "#10b981",
                border: "1px solid #10b98140",
                borderRadius: "20px",
                padding: "4px 12px",
                backgroundColor: "#10b98115",
              }}
            >
              {status}
            </div>
          )}
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "48px",
            fontWeight: "bold",
            color: "#fff",
            lineHeight: 1.2,
            marginBottom: "20px",
            maxWidth: "900px",
          }}
        >
          {title}
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: "40px",
            marginTop: "20px",
          }}
        >
          {budget && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "36px", fontWeight: "bold", color: "#10b981" }}>
                {budget} USDC
              </span>
              <span style={{ fontSize: "14px", color: "#6b7280" }}>Budget</span>
            </div>
          )}
          {milestones && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "36px", fontWeight: "bold", color: "#fff" }}>
                {milestones}
              </span>
              <span style={{ fontSize: "14px", color: "#6b7280" }}>Milestones</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            left: "60px",
            fontSize: "16px",
            color: "#4b5563",
          }}
        >
          gigsafe.pixxmo.com · Trustless Freelance Escrow on Solana
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
