/** @type {import('next').NextConfig} */
const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? '';
const basePath =
  configuredBasePath && configuredBasePath !== '/'
    ? `/${configuredBasePath.replace(/^\/+|\/+$/g, '')}`
    : '';

const nextConfig = {
  // Static HTML export: every section pre-renders to real markup, so crawlers and
  // procurement staff searching for the company get content without executing JS.
  // Deployable to any static host (Vercel, Netlify, S3+CloudFront, IIS, Azure Static Web Apps).
  output: 'export',
  // GitHub project Pages serves the export below /<repository>. The deployment
  // workflow supplies this value; local development stays rooted at `/`.
  basePath,
  trailingSlash: true,
  reactStrictMode: true,
  images: {
    // Required by `output: 'export'` — no server-side image optimizer at runtime.
    unoptimized: true,
  },
};

export default nextConfig;
