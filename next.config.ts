import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // Emit a fully static site into ./out (no server backend needed).
  output: 'export',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // Static export can't run the Next image optimizer, so serve images as-is.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.valorant-api.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
