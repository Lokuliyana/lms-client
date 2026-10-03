import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    const origin = process.env.API_ORIGIN || "http://localhost:4002/api";
    const serverOrigin = origin.replace(/\/api\/?$/, "");
    return [
      { source: "/api/:path*", destination: `${origin}/:path*` },
      { source: "/uploads/:path*", destination: `${serverOrigin}/uploads/:path*` },
    ];
  },
  async redirects() {
    return [
      {
        source: "/admin/quizez",
        destination: "/admin/quizzes",
        permanent: false,
      },
      {
        source: "/admin/quizez/:path*",
        destination: "/admin/quizzes/:path*",
        permanent: false,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "akeagjxcoxqqfjurotod.supabase.co", pathname: "/storage/v1/object/**" },
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
