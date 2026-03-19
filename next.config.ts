import { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    // Prevent build errors if TypeScript has issues
    ignoreBuildErrors: false,
  },
};

export default nextConfig;