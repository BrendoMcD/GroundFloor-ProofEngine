import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/",
          destination: "/prototype/index.html",
        },
        {
          source: "/feed",
          destination: "/prototype/feed.html",
        },
        {
          source: "/discovery",
          destination: "/prototype/discovery.html",
        },
        {
          source: "/signin",
          destination: "/prototype/auth.html",
        },
        {
          source: "/profile",
          destination: "/prototype/profile.html",
        },
      ],
    };
  },
};

export default nextConfig;
