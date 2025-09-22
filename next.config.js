/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  basePath: "/Station-de-pompage",
  assetPrefix: "/Station-de-pompage/",
  trailingSlash: true,
}

module.exports = nextConfig
