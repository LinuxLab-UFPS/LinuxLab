/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  typescript: {
    // Type errors fail the build — this is a real project now, not a mockup.
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },

}

export default nextConfig
