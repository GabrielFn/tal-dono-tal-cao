import type { MetadataRoute } from "next";
import { configPublica } from "@/lib/config/publico";

const SITE = configPublica.siteUrl;

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/privacidade`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE}/termos`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
