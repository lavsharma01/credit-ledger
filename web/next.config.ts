import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Turbopack rooted at web/ (a stray lockfile higher up can confuse it).
  turbopack: { root: __dirname },
  // Allow opening the dev server as http://127.0.0.1 as well as localhost.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
