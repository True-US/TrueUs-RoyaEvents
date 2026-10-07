import type { NextConfig } from "next";

// Event covers are served from Supabase Storage. Build the allowed image host
// from the env var so the same config works for local and hosted Supabase.
const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: supabaseUrl.protocol.replace(":", "") as "http" | "https",
        hostname: supabaseUrl.hostname,
        port: supabaseUrl.port,
        pathname: "/storage/v1/object/public/**",
      },
      // Placeholder covers used by supabase/seed-events.sql.
      // picsum.photos redirects to fastly.picsum.photos, so allow both.
      { protocol: "https", hostname: "picsum.photos", pathname: "/seed/**" },
      { protocol: "https", hostname: "fastly.picsum.photos", pathname: "/id/**" },
    ],
    // Local Supabase runs on 127.0.0.1, which next/image blocks by default.
    // Only allow it in development.
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
  },
  experimental: {
    serverActions: {
      // Covers are compressed to ~200-400 KB in the browser; 2 MB leaves room
      // for the multipart overhead and the other form fields.
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
