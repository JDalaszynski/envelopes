/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ['firebase-admin'],
  /**
   * Wpis o przygotowaniu plików do druku zmienił adres 15 sierpnia 2026
   * (content-plan.md poz. 7) — stary slug niósł frazę należącą do filara
   * /koperty-z-nadrukiem. Przekierowanie 308 zabezpiecza odnośniki wysłane
   * mailem i ewentualne wejścia z zewnątrz.
   */
  async redirects() {
    return [
      {
        source: '/blog/koperty-firmowe-z-nadrukiem-co-przygotowac-przed-zamowieniem',
        destination: '/blog/jak-przygotowac-pliki-do-druku-na-kopertach',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
