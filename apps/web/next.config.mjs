/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@lemma/shared"],
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
