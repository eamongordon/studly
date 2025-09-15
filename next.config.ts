import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse'],
    serverActions: {
      bodySizeLimit: '3mb',
    },
  },
};

export default nextConfig;
