/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
  },

  webpack: (config) => {
    config.parallelism = 1

    config.cache = false

    config.resolve.symlinks = false

    config.snapshot = {
      managedPaths: [],
      immutablePaths: [],
    }

    return config
  },
}

export default nextConfig