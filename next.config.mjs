/** @type {import('next').NextConfig} */
const nextConfig = {
  // Content images are streamed through a route handler (see
  // app/api/writeup-asset), so no remote image config is required.
  // Ensure the local /content directory is traced into the server bundle.
  outputFileTracingIncludes: {
    "/**": ["./content/**/*"],
  },
};

export default nextConfig;
