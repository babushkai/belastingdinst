import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["postgres", "@react-pdf/renderer"],
  poweredByHeader: false,
};

export default nextConfig;
