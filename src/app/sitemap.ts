import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://thepickempool.com";
  const now = new Date();

  const blogPosts: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: post.date ? new Date(post.date) : now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/vs/yahoo-pickem`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/vs/cbs-pickem`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/vs/espn-pickem`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/vs/nfl-pickem`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/vs/sleeper-pickem`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/vs/runyourpool`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/formats`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${base}/support`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    ...blogPosts,
    { url: `${base}/privacy`, lastModified: new Date("2026-05-15"), changeFrequency: "yearly", priority: 0.3 },
  ];
}
