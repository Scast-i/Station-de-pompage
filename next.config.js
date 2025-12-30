/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  basePath: "/Station-de-pompage",
  assetPrefix: "/Station-de-pompage/",
  trailingSlash: true,
}

module.exports = nextConfig
