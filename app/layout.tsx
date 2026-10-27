import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { configPublica } from "@/lib/config/publico";
import { DESCRICAO_SEO, NOME_DO_SITE, TITULO_SEO } from "@/lib/conteudo/seo";

const SITE = configPublica.siteUrl;

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: TITULO_SEO,
  description: DESCRICAO_SEO,
  applicationName: NOME_DO_SITE,
  openGraph: {
    title: "O quanto você se parece com seu pet? 🐶🐱",
    description: "A IA compara você e seu pet e dá uma nota de 0 a 100%. Faça o teste grátis!",
    url: SITE,
    siteName: NOME_DO_SITE,
    locale: "pt_BR",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  // Códigos de verificação do Google Search Console e do Bing Webmaster Tools (variáveis na Vercel).
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION?.trim() || undefined,
    other: process.env.BING_SITE_VERIFICATION?.trim()
      ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION.trim() }
      : undefined,
  },
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
