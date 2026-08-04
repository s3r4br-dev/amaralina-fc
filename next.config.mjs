/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // WebContainer has very low inotify limits (128 instances).
    // watchpack's recursive directory scanning causes EAGAIN errors.
    config.watch = false
    if (config.watchOptions) {
      config.watchOptions = undefined
    }
    if (config.snapshot) {
      config.snapshot.managedPaths = []
      config.snapshot.immutablePaths = []
    }
    // Limit resolve symlinks and cache to reduce fd usage
    if (config.resolve) {
      config.resolve.symlinks = false
    }
    if (config.resolveLoader) {
      config.resolveLoader.symlinks = false
    }
    // Disable cache to avoid extra file operations
    config.cache = false
    // Reduce parallelism to limit concurrent file descriptor usage
    config.parallelism = 1
    return config
  },
}

export default nextConfig
