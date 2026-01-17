import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: 'your-production-domain.com',
        pathname: '/images/**',
      },
    ],
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
};

// https://kfpd9f93-3000.inc1.devtunnels.ms/

export default nextConfig;
