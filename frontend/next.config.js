/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  swcMinify: true,
  images: { unoptimized: true },
  webpack: (config, { isServer }) => {
    // Konva's node entry tries to require('canvas') which is not needed in the browser
    if (!isServer) {
      config.resolve.fallback = { ...config.resolve.fallback, canvas: false };
    } else {
      config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    }
    return config;
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://lumo-api-m7w6.onrender.com',
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'https://lumo-api-m7w6.onrender.com',
  },
};

module.exports = nextConfig;
