import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://thepickempool.com";
  const now = new Date();

  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/vs/yahoo-pickem`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/vs/cbs-pickem`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/sign-in`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/sign-up`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
  ];
}
