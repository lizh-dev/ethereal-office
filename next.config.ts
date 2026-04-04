import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Server-side rewrites use internal Docker hostnames when available
    const apiUrl = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const jitsiUrl = process.env.JITSI_INTERNAL_URL || process.env.NEXT_PUBLIC_JITSI_URL || "https://localhost:8443";
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
      {
        source: "/jitsi/:path*",
        destination: `${jitsiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
