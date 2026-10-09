import { CONTACT_DETAILS } from './orders';
import type { CartItem, Order } from './types';

/**
 * Szablon wiadomości, w której Admin wysyła klientowi PDF z wizualizacją.
 *
 * Wysyłka idzie z prywatnej skrzynki sklepu, nie przez Brevo — generator
 * przygotowuje tylko adresata, temat i treść do wklejenia. Treść mówi to samo,
 * co dokument w załączniku (`visualization-pdf.ts`): co sprawdzić, jak
 * odpowiedzieć i że produkcja czeka na akceptację. Oba miejsca muszą iść
 * w parze, bo klient czyta je jedno po drugim.
 */

export interface VisualizationEmail {
  to: string;
  subject: string;
  body: string;
}

export function buildVisualizationEmail(input: {
  order: Order;
  items: CartItem[];
  version: number;
}): VisualizationEmail {
  const { order, version } = input;
  const items = input.items.length ? input.items : order.items;
  const revised = version > 1;

  const describe = (item: CartItem) => `${item.name}, ${item.price.quantity} szt.`;
  const subjectLine = revised
    ? `w załączniku przesyłamy poprawioną wizualizację (wersja ${version}) do zamówienia ${order.number}`
    : `w załączniku przesyłamy wizualizację do zamówienia ${order.number}`;
  const opening =
    items.length === 1
      ? `${subjectLine} — ${describe(items[0])}`
      : `${subjectLine}:\n${items.map((item) => `– ${describe(item)}`).join('\n')}`;

  const body = [
    'Dzień dobry,',
    opening,
    'Prosimy o sprawdzenie projektu: pisowni nazw, numerów i adresów, układu i wielkości nadruku, koloru i formatu koperty oraz nakładu.',
    'Jeśli wszystko się zgadza, prosimy odpowiedzieć na tę wiadomość: „Akceptuję projekt”. Jeśli coś wymaga zmiany, prosimy opisać poprawki w odpowiedzi — przygotujemy kolejną wersję. W cenie zamówienia mieszczą się dwie korekty.',
    'Produkcję rozpoczynamy po Państwa akceptacji.',
    `Pozdrawiamy\n${CONTACT_DETAILS.brand}\n${CONTACT_DETAILS.email} · ${CONTACT_DETAILS.phone}`,
  ].join('\n\n');

  return {
    to: order.customer.email,
    subject:
      `Wizualizacja do akceptacji — zamówienie ${order.number}` +
      (revised ? ` (wersja ${version})` : ''),
    body,
  };
}

/** Odnośnik otwierający wiadomość w programie pocztowym; załącznik dodaje się ręcznie. */
export function mailtoLink(email: VisualizationEmail): string {
  // RFC 6068: znak końca linii w treści wiadomości to CRLF
  const body = encodeURIComponent(email.body.replace(/\r?\n/g, '\r\n'));
  return `mailto:${encodeURIComponent(email.to)}?subject=${encodeURIComponent(email.subject)}&body=${body}`;
}
