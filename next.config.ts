import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
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
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "akeagjxcoxqqfjurotod.supabase.co", pathname: "/storage/v1/object/**" },
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "img.youtube.com", pathname: "/**" },
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/**" },
      { protocol: "https", hostname: "*.ytimg.com", pathname: "/**" },
      { protocol: "https", hostname: "drive.google.com", pathname: "/**" },
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "*.googleusercontent.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
