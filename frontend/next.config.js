/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Replaces deprecated 'domains'
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    unoptimized: true,
  },
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
  
  // Removed 'swcMinify' (it is invalid in Next 16+)
  
  reactStrictMode: true,

  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  },

  webpack: (config, { isServer }) => {
    // Handle GLTF and GLB files
    config.module.rules.push({
      test: /\.(gltf|glb)$/,
      type: "asset/resource",
    });

    // Handle shader files
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      type: "asset/source",
    });

    // Optimize Three.js for production
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

module.exports = nextConfig;