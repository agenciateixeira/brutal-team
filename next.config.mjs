/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // ⚠️ Temporariamente ignorar erros de TypeScript durante build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Avisos do ESLint não impedem o build
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};

export default nextConfig;
