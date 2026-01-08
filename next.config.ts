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
    // CRITICAL FIX: Disable image optimization to bypass IPv6 private IP blocking
    // Next.js 16 blocks images resolving to private IPs (including IPv6)
    // Supabase CDN uses IPv6 addresses that Next.js considers "private"
    // Setting unoptimized=true bypasses Next.js image optimization and IP checks
    unoptimized: true,
  },

  // CRITICAL FIX: Externalize native modules for webpack builds
  // Turbopack cannot bundle native binaries like @resvg/resvg-js
  // serverExternalPackages tells Next.js to use native Node.js require()
  // See: https://nextjs.org/docs/app/api-reference/config/next-config-js/serverExternalPackages
  serverExternalPackages: ['@resvg/resvg-js', 'sharp'],
};

export default nextConfig;
