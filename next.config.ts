import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.in',
        pathname: '/storage/v1/object/**',
      },
      // Allow any Supabase project subdomain
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
    // Enable image optimization with reasonable limits
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/avif', 'image/webp'],
  },

  // Acknowledge Turbopack usage (Next.js 16 default)
  turbopack: {},
};

export default nextConfig;
