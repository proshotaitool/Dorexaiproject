import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
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
    ],
  },
  serverExternalPackages: ['pdfjs-dist'],
  webpack: (config, { isServer }) => {
    config.resolve.alias.canvas = false;

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        https: false,
        'node:fs': false,
        'node:https': false,
      };

      config.resolve.alias['node:fs'] = false;
      config.resolve.alias['node:https'] = false;
      config.resolve.alias['pptxgenjs'] = 'pptxgenjs/dist/pptxgen.min.js';
    }

    return config;
  },
};

export default nextConfig;
