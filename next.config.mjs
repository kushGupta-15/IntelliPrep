// /** @type {import('next').NextConfig} */
// const nextConfig = {
//     experimental: {
//       appDir: true,
//     },
//   };
  
//   export default nextConfig;
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
      },
    ],
  },
};

export default nextConfig;
