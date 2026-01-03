import type { NextConfig } from "next";

const GW = process.env.OPENCLAW_GW || "http://127.0.0.1:18789";
const API = process.env.API_SERVER || "http://127.0.0.1:8099";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${GW}/:path*` },
      { source: "/agents/:path*", destination: `${API}/agents/:path*` },
      { source: "/agents", destination: `${API}/agents` },
      { source: "/run-agent", destination: `${API}/run-agent` },
      { source: "/ba/:path*", destination: `${API}/ba/:path*` },
      { source: "/db/:path*", destination: `${API}/db/:path*` },
      { source: "/auth/:path*", destination: `${API}/auth/:path*` },
    ];
  },
};

export default nextConfig;
