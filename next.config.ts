import type { NextConfig } from "next";

const resolveApiProxyTarget = () => {
  const rawTarget = process.env.API_BASE_URL || "http://backend:8000";
  return rawTarget.endsWith("/") ? rawTarget.slice(0, -1) : rawTarget;
};

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    const apiProxyTarget = resolveApiProxyTarget();
    return [
      {
        source: "/backend-api/:path*",
        destination: `${apiProxyTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
