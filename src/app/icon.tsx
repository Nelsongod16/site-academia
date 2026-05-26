import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at top, rgba(156,255,121,0.28), transparent 35%), linear-gradient(180deg, #0b0e14 0%, #050608 100%)",
          color: "white",
          fontSize: 220,
          fontWeight: 700,
          letterSpacing: "-0.12em",
        }}
      >
        P
      </div>
    ),
    size,
  );
}
