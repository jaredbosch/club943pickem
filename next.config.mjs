/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    // Pages with a markdown variant (Accept negotiation in src/middleware.ts)
    // must tell caches the response varies on Accept.
    const negotiatedPages = ["/", "/formats", "/support", "/privacy", "/about", "/docs", "/blog", "/blog/:slug"];
    return [
      { source: "/(.*)", headers: securityHeaders },
      ...negotiatedPages.map((source) => ({
        source,
        headers: [{ key: "Vary", value: "Accept" }],
      })),
    ];
  },
};

export default nextConfig;
