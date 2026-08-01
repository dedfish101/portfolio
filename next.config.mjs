/** @type {import('next').NextConfig} */
const nextConfig = {
  // Content images are streamed through a route handler (see
  // app/api/asset/[kind]/[slug]/[...path]), so no remote image config is
  // required. Ensure the local /content directory is traced into the server
  // bundle.
  outputFileTracingIncludes: {
    "/**": ["./content/**/*"],
  },

  // Dev-only: hosts allowed to request /_next/* when previewing the dev server
  // from another device on the LAN (phone, tablet). Has no effect on `next
  // build` / production. Widen or edit the range if your router hands out a
  // different subnet.
  allowedDevOrigins: ["192.168.0.107", "192.168.0.*", "192.168.1.*"],
};

export default nextConfig;
