import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sql.js", "@netlify/blobs"],
  outputFileTracingIncludes: {
    "/api/**": ["./data/**", "./node_modules/sql.js/dist/sql-asm.js"],
    "/*": ["./data/**", "./node_modules/sql.js/dist/sql-asm.js"],
  },
};

export default nextConfig;
