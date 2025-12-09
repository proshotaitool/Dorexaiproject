import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
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
      const mockPath = path.join(__dirname, 'src/mocks/empty.js');
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        https: false,
        'node:fs': false,
      };

      config.resolve.alias['node:fs'] = mockPath;
      config.resolve.alias['pptxgenjs'] = path.join(__dirname, 'node_modules/pptxgenjs/dist/pptxgen.min.js');

      config.plugins.push(
        new (require('webpack').NormalModuleReplacementPlugin)(
          /^node:/,
          (resource: any) => {
            resource.request = resource.request.replace(/^node:/, '');
          }
        )
      );
    }

    return config;
  },
};

export default nextConfig;
