import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        // Ketika di Vercel/Production ada yang menembak ke /api/...,
        // Next.js akan melemparkannya ke folder api/index.py
        source: '/api/:path*',
        destination: '/api/:path*', 
      },
    ];
  },
};

export default nextConfig;