/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  // Optimize for Molstar and handle Node.js modules
  webpack: (config, { isServer }) => {
    // Handle Node.js modules that can't run in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
        events: false,
        url: false,
        querystring: false,
        os: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }

    // Handle Molstar's large bundle size
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization.splitChunks,
        chunks: "all",
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          molstar: {
            test: /[\\/]node_modules[\\/](molstar)[\\/]/,
            name: "molstar",
            chunks: "all",
            priority: 30,
          },
        },
      },
    };

    return config;
  },
};

module.exports = nextConfig;
