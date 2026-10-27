import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { configPublica } from "@/lib/config/publico";

const SITE = configPublica.siteUrl;

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "Tal Dono, Tal Pet — o quanto você se parece com seu pet?",
  description:
    "Mande uma selfie e uma foto do seu cachorro, gato ou outro pet e a IA diz quantos % vocês são parecidos. Grátis, rápido e as fotos não ficam salvas.",
  openGraph: {
    title: "O quanto você se parece com seu pet? 🐶🐱",
    description: "A IA compara você e seu pet e dá uma nota de 0 a 100%. Faça o teste grátis!",
    url: SITE,
    siteName: "Tal Dono, Tal Pet",
    locale: "pt_BR",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#FFF3E0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
