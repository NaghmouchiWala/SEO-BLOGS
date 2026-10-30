import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* This app is an internal, auth-gated admin dashboard with no static
     content — every page needs fresh data on every request, so Cache
     Components' strict prerendering requirement doesn't apply here and is
     disabled rather than worked around per-route. */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
