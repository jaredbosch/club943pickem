import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/vs/", "/privacy", "/sign-in", "/sign-up"],
      disallow: ["/league/", "/dashboard", "/picks", "/grid", "/commissioner", "/settings", "/api/"],
    },
    sitemap: "https://thepickempool.com/sitemap.xml",
  };
}
