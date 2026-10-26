/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  experimental: { serverActions: { bodySizeLimit: '1mb' } },
  webpack: (config, { isServer }) => {
    // QPDF WASM (buka kunci PDF di browser) memuat modul Node opsional yang tidak dipakai di browser.
    if (!isServer) config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false, crypto: false }
    return config
  },
}
export default nextConfig
