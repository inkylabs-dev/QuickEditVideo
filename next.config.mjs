/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export', // Enables static exports
  trailingSlash: true, // Ensure all routes have trailing slashes
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  // Empty turbopack config to silence the warning and let it use defaults
  turbopack: {},
  webpack: (config, { isServer }) => {
    // Handle WASM files (only used when webpack mode is explicitly enabled)
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Add rule for WASM files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    // Fallback for node modules in client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    return config;
  },
};

export default nextConfig;
