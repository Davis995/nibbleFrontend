import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  reactCompiler: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
    allowedDevOrigins: [
    "http://172.16.49.1:3000",
    "http://localhost:3000",
  ],
};

export default nextConfig;
