import { NextResponse, type NextRequest } from 'next/server';

/**
 * Tryb prac konserwatorskich.
 *
 * Włączony odpowiada na publicznej domenie kodem 503 z nagłówkiem
 * `Retry-After` — wyszukiwarki traktują to jako chwilową przerwę i nie
 * zdejmują stron z indeksu (przekierowanie albo 200 z komunikatem
 * podmieniłyby treść wszystkich adresów). Wyłączenie: `false` poniżej,
 * commit i promocja wdrożenia na produkcję.
 *
 * Bez zmian działają:
 * - panel administracyjny `/admin` z wywołaniami API, z których korzysta
 *   (role sprawdza każda trasa API, nie ten plik),
 * - webhook Przelewy24 — płatności rozpoczęte przed przerwą muszą się
 *   zaksięgować w zamówieniach,
 * - zapytania GET do API (dokumenty PDF i pliki z linków w mailach),
 * - pliki statyczne: `_next`, `public/`, robots.txt, sitemap.xml.
 * Każda inna operacja zapisu w API (nowe zamówienie, formularz kontaktowy,
 * wgranie pliku, rejestracja, akceptacja projektu) dostaje 503 — także
 * z karty otwartej przed włączeniem przerwy.
 *
 * Tryb obejmuje tylko domenę sklepu: lokalny `next dev` i wdrożenia Preview
 * działają normalnie, więc da się na nich sprawdzać poprawki w trakcie przerwy.
 */
const MAINTENANCE_MODE = true;

const PUBLIC_HOSTS = new Set(['envelopes.pl', 'www.envelopes.pl']);

/** Sugerowany czas ponownej wizyty robota (sekundy). */
const RETRY_AFTER = '3600';

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const ALLOWED_API_WRITES = [
  /^\/api\/platnosci\/p24\/webhook\/?$/,
  // Panel admina: status, usunięcie, faktura i wizualizacja zamówienia
  /^\/api\/orders\/[^/]+(?:\/(?:faktura|wizualizacja))?\/?$/,
];

/* Dane kontaktowe wpisane na sztywno — proxy nie powinno zależeć od modułów
   aplikacji (dokumentacja Next), a `@/lib/orders` pociąga za sobą cennik. */
const MAINTENANCE_PAGE = `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Prace konserwatorskie | Envelopes</title>
<link rel="icon" href="/icon.png">
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 24px 16px;
    background: #f4f2ec;
    color: #1f2430;
    font: 16px/1.6 system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  }
  main {
    max-width: 520px;
    background: #fff;
    border: 1px solid #dcd8cc;
    border-top: 4px solid #2a4e7e;
    border-radius: 6px;
    padding: 40px 32px;
  }
  .brand {
    margin: 0 0 24px;
    font: 600 13px/1 ui-monospace, 'SF Mono', Menlo, monospace;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: #2a4e7e;
  }
  h1 {
    margin: 0 0 16px;
    font: 600 28px/1.25 Georgia, 'Times New Roman', serif;
  }
  p { margin: 0 0 12px; color: #575e6e; }
  a { color: #2a4e7e; }
  .contact {
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid #dcd8cc;
    font-size: 15px;
  }
</style>
</head>
<body>
<main>
  <p class="brand">Envelopes</p>
  <h1>Strona jest chwilowo niedostępna</h1>
  <p>Trwają prace konserwatorskie. Sklep wróci do działania wkrótce — przepraszamy za utrudnienia.</p>
  <p class="contact">W pilnych sprawach napisz na <a href="mailto:kontakt@envelopes.pl">kontakt@envelopes.pl</a>
  lub zadzwoń: <a href="tel:+48695527166">+48 695 527 166</a> (pon.–pt. 8:00–16:00).</p>
</main>
</body>
</html>`;

const MAINTENANCE_HEADERS = {
  'Retry-After': RETRY_AFTER,
  'Cache-Control': 'no-store',
};

export function proxy(request: NextRequest) {
  // Nagłówek Host, nie `nextUrl.hostname` — `next start` składa ten adres
  // z własnej nazwy serwera (localhost), a nie z domeny, o którą pytał klient
  const host = (request.headers.get('host') ?? '').replace(/:\d+$/, '').toLowerCase();
  if (!MAINTENANCE_MODE || !PUBLIC_HOSTS.has(host)) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/')) {
    if (READ_METHODS.has(request.method) || ALLOWED_API_WRITES.some((route) => route.test(pathname))) {
      return NextResponse.next();
    }
    return Response.json(
      { error: 'Trwają prace konserwatorskie — spróbuj ponownie później.' },
      { status: 503, headers: MAINTENANCE_HEADERS }
    );
  }

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return NextResponse.next();
  }

  return new Response(request.method === 'HEAD' ? null : MAINTENANCE_PAGE, {
    status: 503,
    headers: { ...MAINTENANCE_HEADERS, 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export const config = {
  // Ścieżki z kropką to pliki (public/, robots.txt, sitemap.xml, ikony) — przechodzą bez zmian
  matcher: ['/((?!_next/static|_next/image|.*\\..*).*)'],
};
