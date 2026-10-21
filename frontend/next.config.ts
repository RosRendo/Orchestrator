import type { NextConfig } from "next";

const BACKEND_INTERNAL_URL = process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:3005';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/automation/:path*',
        destination: `${BACKEND_INTERNAL_URL}/automation/:path*`,
      },
      {
        source: '/projects/:path*',
        destination: `${BACKEND_INTERNAL_URL}/projects/:path*`,
      },
      {
        source: '/sessions/:path*',
        destination: `${BACKEND_INTERNAL_URL}/sessions/:path*`,
      },
      {
        source: '/telegram/:path*',
        destination: `${BACKEND_INTERNAL_URL}/telegram/:path*`,
      },
      {
        source: '/socket.io/:path*',
        destination: `${BACKEND_INTERNAL_URL}/socket.io/:path*`,
      },
    ];
  },
};

export default nextConfig;
