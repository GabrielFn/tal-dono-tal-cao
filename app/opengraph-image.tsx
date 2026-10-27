// Imagem de preview que aparece quando o link é enviado no WhatsApp, Instagram, etc.
import { ImageResponse } from "next/og";

export const alt = "Tal Dono, Tal Cão — o quanto você se parece com seu cachorro?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#FFF3E0",
        color: "#2A1A10",
        fontFamily: "sans-serif",
        padding: 60,
      }}
    >
      <div
        style={{
          display: "flex",
          padding: "10px 28px",
          border: "5px solid #2A1A10",
          borderRadius: 999,
          background: "#fff",
          fontSize: 34,
          fontWeight: 800,
          marginBottom: 36,
        }}
      >
        TAL DONO, TAL CÃO
      </div>
      <div style={{ display: "flex", fontSize: 76, fontWeight: 900, textAlign: "center", lineHeight: 1.05 }}>
        O quanto você se parece com o seu cachorro?
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 44,
          padding: "18px 44px",
          background: "#FF6B2C",
          color: "#fff",
          border: "5px solid #2A1A10",
          borderRadius: 999,
          fontSize: 40,
          fontWeight: 800,
          boxShadow: "8px 8px 0 #2A1A10",
        }}
      >
        Faça o teste grátis com IA
      </div>
    </div>,
    size,
  );
}
