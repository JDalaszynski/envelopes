#!/usr/bin/env node
/**
 * IndexNow — zgłoszenie zmienionych adresów do wyszukiwarek uczestniczących
 * w protokole (Bing, Yandex, Seznam, Naver).
 *
 * **Po co to jest.** Google adresy odkrywa sam i szybko; Bing bez zgłoszenia
 * potrafi zwlekać tygodniami. Indeks Bing jest jednocześnie źródłem wyników
 * dla ChatGPT Search i Copilota, więc opóźnienie w Bing to opóźnienie
 * w widoczności w modelach — czyli w tym kanale, pod który przygotowany jest
 * `/llms.txt` i cała warstwa danych strukturalnych.
 *
 * **Dlaczego skrypt, a nie wywołanie z aplikacji.** Treść serwisu mieszka
 * w kodzie (`blog.ts`, strony filarowe), więc publikacja jest równoznaczna
 * z wdrożeniem. Nie ma momentu, w którym działająca aplikacja dowiaduje się
 * o nowej stronie — ten moment ma człowiek wypuszczający deploy, i to on
 * uruchamia zgłoszenie.
 *
 * **Skąd bierze się lista adresów.** Z sitemapy pobranej z **działającego
 * serwisu**, nie z kodu źródłowego. Zgłoszenie adresu, który jeszcze nie jest
 * wdrożony, kończy się wizytą crawlera na 404 — a to sygnał gorszy niż brak
 * zgłoszenia. Sitemapa produkcyjna z definicji zawiera wyłącznie to, co
 * faktycznie stoi na serwerze, i niesie `lastmod` z „Dziennika wdrożeń"
 * (`PAGE_UPDATED` w `sitemap.ts`), czyli jedyną wiarygodną informację
 * o tym, kiedy treść naprawdę się zmieniła.
 *
 * Użycie:
 *   npm run indexnow                      adresy zmienione w ostatnich 7 dniach
 *   npm run indexnow -- --days 30         to samo, szersze okno
 *   npm run indexnow -- --all             cała sitemapa (zgłoszenie startowe)
 *   npm run indexnow -- /koperty-dl /blog/jak-przygotowac-pliki-do-druku-na-kopertach
 *   npm run indexnow -- --all --dry-run   pokazuje listę, nic nie wysyła
 *   npm run indexnow -- --host http://localhost:3000 --all --dry-run
 */

import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * Punkt zbiorczy protokołu: przyjmuje jedno zgłoszenie i rozsyła je do
 * wszystkich wyszukiwarek uczestniczących. Osobne wywołania pod `bing.com`
 * i `yandex.com` dawałyby ten sam efekt większym kosztem.
 */
const ENDPOINT = 'https://api.indexnow.org/indexnow';

/** Limit protokołu na jedno żądanie. Serwis ma dziś kilkanaście adresów,
 *  ale dzielenie na paczki kosztuje trzy linijki i zdejmuje temat na zawsze. */
const MAX_URLS_PER_REQUEST = 10_000;

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = join(ROOT, 'public');

/** Klucz IndexNow: 8–128 znaków szesnastkowych, nazwa pliku = wartość klucza. */
const KEY_FILE_PATTERN = /^([0-9a-fA-F]{8,128})\.txt$/;

/* ── Argumenty ─────────────────────────────────────────────────────────── */

function parseArgs(argv) {
  const options = { all: false, days: 7, dryRun: false, host: null, paths: [] };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--all') options.all = true;
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--days') options.days = Number(argv[(i += 1)]);
    else if (arg.startsWith('--days=')) options.days = Number(arg.slice('--days='.length));
    else if (arg === '--host') options.host = argv[(i += 1)];
    else if (arg.startsWith('--host=')) options.host = arg.slice('--host='.length);
    else if (arg.startsWith('--')) fail(`Nieznany przełącznik: ${arg}`);
    else options.paths.push(arg);
  }

  if (!Number.isFinite(options.days) || options.days <= 0) {
    fail('--days wymaga liczby dodatniej.');
  }
  return options;
}

/**
 * Przerwanie z komunikatem. Świadomie `throw`, a nie `process.exit()`:
 * w chwili błędu potrafi być otwarte połączenie HTTP, a natychmiastowe
 * ubicie procesu kończy się na Windowsie asercją libuv wypisaną **po**
 * komunikacie o błędzie — czyli hałasem przykrywającym właściwą przyczynę.
 * Wyjątek łapie `main()`, ustawia kod wyjścia i pozwala procesowi dojść
 * do końca samodzielnie.
 */
class IndexNowError extends Error {}

function fail(message) {
  throw new IndexNowError(message);
}

/* ── Klucz ─────────────────────────────────────────────────────────────── */

/**
 * Klucz czytamy z pliku w `public/`, a nie ze stałej w kodzie — po to, żeby
 * miał w projekcie **jedno** źródło. To ten sam plik, którym serwis dowodzi
 * wyszukiwarce, że zgłoszenie pochodzi od właściciela domeny; stała obok
 * niego mogłaby się z nim rozjechać przy pierwszej podmianie klucza,
 * a objawem byłby HTTP 403 bez wskazania przyczyny.
 *
 * Klucz nie jest sekretem: cały model weryfikacji polega na tym, że plik
 * jest publicznie dostępny pod adresem domeny. Dlatego leży w repozytorium,
 * a nie w zmiennych środowiskowych.
 */
function readKey() {
  const matches = readdirSync(PUBLIC_DIR)
    .map((name) => name.match(KEY_FILE_PATTERN))
    .filter(Boolean);

  if (matches.length === 0) {
    fail(
      'Brak pliku klucza w public/. Utwórz `public/<klucz>.txt`, gdzie <klucz> to 8–128 ' +
        'znaków szesnastkowych, a zawartością pliku jest ten sam klucz.'
    );
  }
  if (matches.length > 1) {
    fail(
      `W public/ leży ${matches.length} plików klucza (${matches.map((m) => m[0]).join(', ')}). ` +
        'Zostaw jeden — inaczej nie wiadomo, którym podpisać zgłoszenie.'
    );
  }

  const [fileName, key] = [matches[0][0], matches[0][1]];
  const content = readFileSync(join(PUBLIC_DIR, fileName), 'utf8').trim();

  if (content !== key) {
    fail(
      `Zawartość ${fileName} („${content}") nie odpowiada nazwie pliku. ` +
        'Protokół wymaga, żeby plik zawierał dokładnie ten klucz, którym jest nazwany.'
    );
  }
  return { key, fileName };
}

/* ── Adresy ────────────────────────────────────────────────────────────── */

function normalizeHost(raw) {
  const value = (raw ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'https://envelopes.pl').replace(
    /\/+$/,
    ''
  );
  try {
    return { origin: value, hostname: new URL(value).hostname };
  } catch {
    return fail(`Nieprawidłowy adres serwisu: ${value}`);
  }
}

/**
 * Sitemapa Next.js niesie obok `<loc>` także `<image:loc>` — wyciągamy
 * wyłącznie adresy stron, biorąc pierwszy `<loc>` z każdego bloku `<url>`.
 */
function parseSitemap(xml) {
  const entries = [];
  for (const [, block] of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = block.match(/<loc>(.*?)<\/loc>/)?.[1];
    if (!loc) continue;
    const lastmod = block.match(/<lastmod>(.*?)<\/lastmod>/)?.[1] ?? null;
    entries.push({ loc: decodeXml(loc), lastmod });
  }
  return entries;
}

function decodeXml(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'");
}

async function fetchSitemap(origin) {
  const url = `${origin}/sitemap.xml`;
  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    return fail(`Nie udało się pobrać ${url}: ${error.message}`);
  }
  if (!response.ok) fail(`${url} zwróciło HTTP ${response.status}.`);
  return parseSitemap(await response.text());
}

/** Adresy podane ręcznie — jako ścieżki albo pełne adresy tego samego hosta. */
function resolvePaths(paths, { origin, hostname }) {
  return paths.map((path) => {
    /*
     * Git Bash na Windowsie zamienia argument zaczynający się od ukośnika
     * na ścieżkę systemową (`/koperty-dl` → `C:/Program Files/Git/koperty-dl`),
     * zanim zobaczy go Node. Bez tej kontroli do wyszukiwarek poszedłby adres
     * nieistniejący — czyli dokładnie to, przed czym ten skrypt ma chronić.
     */
    if (/^[A-Za-z]:[\\/]/.test(path)) {
      fail(
        `Argument „${path}" wygląda na ścieżkę systemową — powłoka rozwinęła wiodący ukośnik. ` +
          'Podaj ścieżkę bez niego (np. `koperty-dl`) albo pełny adres.'
      );
    }
    if (/^https?:\/\//.test(path)) {
      const parsed = new URL(path);
      if (parsed.hostname !== hostname) {
        fail(`Adres ${path} nie należy do ${hostname} — zgłoszenie zostałoby odrzucone (422).`);
      }
      return parsed.toString();
    }
    return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
  });
}

/* ── Weryfikacja klucza na serwerze ────────────────────────────────────── */

/**
 * Sprawdzenie **przed** wysyłką, że plik klucza jest już wdrożony. Bez tego
 * pierwsze zgłoszenie po podmianie klucza kończy się na 403, a odpowiedź
 * protokołu nie mówi wprost, czego brakuje.
 */
async function verifyKeyFile(origin, fileName, key) {
  const url = `${origin}/${fileName}`;
  try {
    const response = await fetch(url);
    if (!response.ok) return { ok: false, reason: `HTTP ${response.status}`, url };
    const body = (await response.text()).trim();
    if (body !== key) return { ok: false, reason: 'plik zawiera inną wartość', url };
    return { ok: true, url };
  } catch (error) {
    return { ok: false, reason: error.message, url };
  }
}

/* ── Zgłoszenie ────────────────────────────────────────────────────────── */

const STATUS_NOTES = {
  200: 'przyjęte',
  202: 'przyjęte, klucz w trakcie weryfikacji',
  400: 'nieprawidłowy format zgłoszenia',
  403: 'klucz odrzucony — plik klucza nie jest dostępny pod adresem domeny',
  422: 'adresy spoza zgłoszonego hosta albo niezgodność klucza',
  429: 'za dużo zgłoszeń — odczekaj i powtórz',
};

async function submit(urls, { key, keyLocation, hostname }) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: hostname, key, keyLocation, urlList: urls }),
  });

  const note = STATUS_NOTES[response.status] ?? 'nieoczekiwana odpowiedź';
  const line = `HTTP ${response.status} — ${note}`;
  if (response.ok) {
    console.log(`✓ ${line} (${urls.length} adres(ów))`);
    return true;
  }
  console.error(`✗ ${line}`);
  const body = (await response.text()).trim();
  if (body) console.error(`  ${body}`);
  return false;
}

/* ── Przebieg ──────────────────────────────────────────────────────────── */

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const { key, fileName } = readKey();
  const { origin, hostname } = normalizeHost(options.host);

  let urls;
  if (options.paths.length > 0) {
    urls = resolvePaths(options.paths, { origin, hostname });
    console.log(`Adresy podane ręcznie: ${urls.length}`);
  } else {
    const entries = await fetchSitemap(origin);
    if (options.all) {
      urls = entries.map((entry) => entry.loc);
      console.log(`Cała sitemapa: ${urls.length} adres(ów)`);
    } else {
      const cutoff = new Date(Date.now() - options.days * 86_400_000);
      urls = entries
        .filter((entry) => entry.lastmod && new Date(entry.lastmod) >= cutoff)
        .map((entry) => entry.loc);
      console.log(
        `Zmienione w ostatnich ${options.days} dniach: ${urls.length} z ${entries.length} adresów w sitemapie`
      );
    }
  }

  if (urls.length === 0) {
    console.log('Nie ma czego zgłaszać — kończę bez wysyłki.');
    return;
  }
  for (const url of urls) console.log(`  ${url}`);

  const keyCheck = await verifyKeyFile(origin, fileName, key);
  if (keyCheck.ok) {
    console.log(`✓ Plik klucza dostępny: ${keyCheck.url}`);
  } else if (options.dryRun) {
    console.warn(`! Plik klucza niedostępny (${keyCheck.reason}): ${keyCheck.url}`);
  } else {
    fail(
      `Plik klucza niedostępny (${keyCheck.reason}): ${keyCheck.url}. ` +
        'Wdróż go przed zgłoszeniem — bez niego protokół odrzuci wysyłkę (403).'
    );
  }

  if (options.dryRun) {
    console.log('— tryb --dry-run, nic nie wysłano.');
    return;
  }

  /* Adresy lokalne odrzucamy świadomie: punkt zbiorczy protokołu i tak
     odpowiedziałby błędem, a w logu zostałaby nieprawdziwa próba zgłoszenia
     domeny, której nie ma w internecie. */
  if (/^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(hostname)) {
    fail(`Host ${hostname} jest lokalny — zgłoszenie ma sens wyłącznie dla domeny publicznej.`);
  }

  const keyLocation = `${origin}/${fileName}`;
  let allOk = true;
  for (let i = 0; i < urls.length; i += MAX_URLS_PER_REQUEST) {
    const chunk = urls.slice(i, i + MAX_URLS_PER_REQUEST);
    /* eslint-disable-next-line no-await-in-loop -- paczki muszą iść po kolei */
    const ok = await submit(chunk, { key, keyLocation, hostname });
    allOk &&= ok;
  }
  if (!allOk) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`✗ ${error instanceof IndexNowError ? error.message : (error.stack ?? error)}`);
  process.exitCode = 1;
});
