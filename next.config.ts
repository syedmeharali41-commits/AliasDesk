import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
