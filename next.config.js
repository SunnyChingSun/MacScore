/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server Actions are enabled by default in Next.js 14+
  webpack: (config, { isServer }) => {
    // Fix for busboy warning - it's an optional dependency
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        busboy: false,
      };
    }
    return config;
  },
  // Improve error handling
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
}

module.exports = nextConfig
