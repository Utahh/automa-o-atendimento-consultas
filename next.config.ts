import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // O worker é um segundo runtime; o build web não precisa empacotar o pg-boss.
  serverExternalPackages: ['pg', 'pg-boss'],
  experimental: {
    // Server Actions são a única porta de escrita do front.
    serverActions: { bodySizeLimit: '2mb' },
  },
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },
};

export default nextConfig;
