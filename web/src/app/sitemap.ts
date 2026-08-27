import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  for (const locale of locales) {
    entries.push({
      url: `https://kicknap.com/${locale}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    });
    entries.push({
      url: `https://kicknap.com/${locale}/search`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    });
  }
  return entries;
}