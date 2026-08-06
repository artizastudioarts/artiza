import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // These two packages ship a binary (a headless Chromium build) that
  // needs to stay at its normal node_modules location at runtime — if
  // Next.js's bundler processes and relocates their files like regular
  // code, the package can't find its own binary anymore. This tells
  // Next.js to leave them alone.
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  // Chromium's binary is loaded dynamically at runtime (not through a
  // normal import), so Vercel's automatic file-tracing can miss it even
  // with the above setting — this explicitly guarantees it's included in
  // every serverless function's deployment bundle.
  outputFileTracingIncludes: {
    "/*": ["./node_modules/@sparticuz/chromium/bin/**/*"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
