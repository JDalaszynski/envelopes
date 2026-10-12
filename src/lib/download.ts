/**
 * Pobranie pliku z trasy wymagającej tokenu. Zwykły odnośnik nie wyśle
 * nagłówka `Authorization`, więc plik pobieramy przez `fetch` i podajemy
 * przeglądarce jako obiekt lokalny.
 *
 * Zwraca komunikat błędu albo `null`, gdy pobieranie ruszyło.
 */
export async function downloadWithAuth(
  url: string,
  token: string | null,
  fallbackName: string
): Promise<string | null> {
  let res: Response;
  try {
    res = await fetch(url, { headers: token ? { authorization: `Bearer ${token}` } : {} });
  } catch {
    return 'Nie udało się połączyć z serwerem.';
  }
  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    return json.error ?? 'Nie udało się pobrać pliku.';
  }

  const name = /filename="([^"]+)"/.exec(res.headers.get('content-disposition') ?? '')?.[1];
  saveBlob(await res.blob(), name ?? fallbackName);
  return null;
}

export function saveBlob(blob: Blob, name: string): void {
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Zwolnienie od razu potrafi przerwać pobieranie w Safari
  window.setTimeout(() => URL.revokeObjectURL(href), 60_000);
}
