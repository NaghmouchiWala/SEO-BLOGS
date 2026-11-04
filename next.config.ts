import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  async redirects() {
    // Was app/page.tsx (redirect to the default locale); now that
    // app/[locale]/layout.tsx is the root layout it lives here.
    return [{ source: "/", destination: "/fr", permanent: false }];
  },
  turbopack: {
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
