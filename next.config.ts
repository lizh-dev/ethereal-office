import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const jitsiUrl = process.env.NEXT_PUBLIC_JITSI_URL || "http://localhost:8880";
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
