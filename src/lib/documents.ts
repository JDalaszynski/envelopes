import 'server-only';

import { buildPdf, type PdfLine } from './pdf';
import { formatDate, formatPrice, round2 } from './pricing';
import { BANK_TRANSFER_DETAILS, CONTACT_DETAILS } from './orders';
import type { Order } from './types';

/**
 * Faktura proforma (pkt 1.12) — wezwanie do zapłaty przy przelewie
 * tradycyjnym. Fakturę VAT wystawia wyłącznie inFakt (`infakt.ts`); sklep nie
 * składa jej sam, żeby do jednej sprzedaży nie istniały dwa dokumenty.
 */
export function buildProformaPdf(order: Order): Buffer {
  const buyer = order.customer.isCompany
    ? [order.customer.firma ?? '', order.customer.nip ? `NIP ${order.customer.nip}` : '']
    : [`${order.customer.imie} ${order.customer.nazwisko}`];

  const lines: PdfLine[] = [
    { text: 'Envelopes', size: 20, bold: true },
    { text: `FAKTURA PROFORMA do zamówienia ${order.number}`, size: 12, bold: true, spaceBefore: 6 },
    { text: `Data wystawienia: ${formatDate(order.createdAt)}`, size: 10, spaceBefore: 10 },
    {
      text: 'Dokument nie jest fakturą VAT i nie stanowi podstawy do odliczenia podatku.',
      size: 9,
    },

    { text: 'Sprzedawca', size: 11, bold: true, spaceBefore: 16 },
    { text: CONTACT_DETAILS.company, size: 10 },
    { text: CONTACT_DETAILS.address, size: 10 },
    { text: `NIP ${CONTACT_DETAILS.nip} · REGON ${CONTACT_DETAILS.regon}`, size: 10 },

    { text: 'Nabywca', size: 11, bold: true, spaceBefore: 14 },
    ...buyer.filter(Boolean).map((text) => ({ text, size: 10 })),
    { text: order.customer.ulica, size: 10 },
    { text: `${order.customer.kodPocztowy} ${order.customer.miasto}`, size: 10 },

    { text: 'Pozycje zamówienia', size: 11, bold: true, spaceBefore: 18 },
  ];

  for (const item of order.items) {
    lines.push({
      text: item.name,
      size: 10,
      right: formatPrice(item.price.gross),
    });
    lines.push({
      text: `   ${item.price.quantity} szt. × ${formatPrice(item.price.unitTotal)} brutto`,
      size: 9,
    });
  }

  lines.push({
    text: 'Dostawa',
    size: 10,
    right: formatPrice(order.totals.deliveryGross),
    spaceBefore: 6,
  });

  lines.push(
    { text: 'Wartość netto', size: 10, right: formatPrice(order.totals.net), spaceBefore: 10 },
    { text: 'VAT 23%', size: 10, right: formatPrice(order.totals.vat) },
    { text: 'RAZEM BRUTTO', size: 12, bold: true, right: formatPrice(order.totals.gross), spaceBefore: 4 }
  );

  lines.push(
    { text: 'Dane do przelewu', size: 11, bold: true, spaceBefore: 20 },
    { text: `Odbiorca: ${BANK_TRANSFER_DETAILS.odbiorca}`, size: 10 },
    { text: `Bank: ${BANK_TRANSFER_DETAILS.bank}`, size: 10 },
    { text: `Numer konta: ${BANK_TRANSFER_DETAILS.konto}`, size: 10 },
    { text: `Kwota: ${formatPrice(order.totals.gross)}`, size: 10 },
    { text: `Tytuł przelewu: ${order.number}`, size: 10, bold: true },
    {
      text: 'Druk rusza po zaksięgowaniu wpłaty (lub po ewentualnym zaakceptowaniu projektów przed drukiem). ',
      size: 9,
      spaceBefore: 10,
    }
  );

  lines.push({
    text: `Wartość zamówienia obliczona wg cennika obowiązującego ${formatDate(order.createdAt)}.`,
    size: 8,
    spaceBefore: 24,
  });

  return buildPdf(lines);
}

/** Sprawdza spójność sum — używane przy wystawianiu dokumentu. */
export function verifyTotals(order: Order): boolean {
  const expected = round2(order.totals.itemsGross + order.totals.deliveryGross);
  return Math.abs(expected - order.totals.gross) < 0.02;
}
