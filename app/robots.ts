import type { MetadataRoute } from "next";
import { configPublica } from "@/lib/config/publico";

const SITE = configPublica.siteUrl;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
