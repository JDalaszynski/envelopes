import 'server-only';

import { formatPrice, formatDate } from './pricing';
import {
  BANK_TRANSFER_DETAILS,
  CONTACT_DETAILS,
  PAYMENT_METHOD_LABEL,
  isGatewayPayment,
} from './orders';
import { SITE_URL } from './seo';
import type { Order } from './types';

/**
 * Brevo — wyłącznie e-maile transakcyjne (pkt 8.1): potwierdzenie zamówienia,
 * wizualizacja do akceptacji, potwierdzenie wpłaty, zmiana statusu oraz
 * wiadomość z formularza kontaktowego.
 *
 * Wszystkie wywołania idą z serwerowych endpointów na Vercel; klucz API
 * nigdy nie trafia do bundla klienckiego.
 */

const API_BASE = 'https://api.brevo.com/v3';
const API_KEY = process.env.BREVO_API_KEY;
const SENDER = {
  email: process.env.BREVO_SENDER_EMAIL ?? CONTACT_DETAILS.email,
  name: process.env.BREVO_SENDER_NAME ?? 'Envelopes',
};

export const isBrevoConfigured = Boolean(API_KEY);

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

async function brevoFetch(endpoint: string, body: unknown): Promise<Response> {
  return fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'api-key': API_KEY as string,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
}

export async function sendEmail(payload: EmailPayload): Promise<{ sent: boolean; reason?: string }> {
  if (!isBrevoConfigured) {
    // DEV FALLBACK — brak klucza API. Treść trafia do logu serwera,
    // dzięki czemu proces jest w pełni prześledzalny bez konta Brevo.
    console.info(
      `\n[Brevo — tryb bez klucza API]\n  Do: ${payload.to}\n  Temat: ${payload.subject}\n  Treść: ${payload.html
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 600)}\n`
    );
    return { sent: false, reason: 'BREVO_API_KEY nie jest ustawiony — e-mail zapisany w logu serwera.' };
  }

  try {
    const res = await brevoFetch('/smtp/email', {
      sender: SENDER,
      to: [{ email: payload.to }],
      subject: payload.subject,
      htmlContent: payload.html,
    });
    if (!res.ok) {
      console.error('[Brevo] Błąd wysyłki:', res.status, await res.text());
      return { sent: false, reason: `Brevo zwróciło status ${res.status}` };
    }
    return { sent: true };
  } catch (error) {
    console.error('[Brevo] Wyjątek przy wysyłce:', error);
    return { sent: false, reason: 'Nie udało się połączyć z Brevo.' };
  }
}

/* Sklep nie prowadzi newslettera ani wysyłki informacji handlowych —
   Brevo obsługuje wyłącznie wiadomości transakcyjne wymienione poniżej
   (§3 ust. 5 Regulaminu). */

/* ── Szablony wiadomości ────────────────────────────────────── */

const siteUrl = SITE_URL;

function shell(title: string, body: string): string {
  return `<!doctype html><html lang="pl"><body style="margin:0;background:#F5F1E6;padding:32px 16px;font-family:Georgia,serif;color:#20242E">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #E3D9C4;border-radius:14px;padding:32px">
<tr><td>
<p style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#565C6E;margin:0 0 8px;font-family:Arial,sans-serif">Envelopes</p>
<h1 style="font-size:24px;line-height:1.25;margin:0 0 16px">${title}</h1>
<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#20242E">${body}</div>
<p style="margin:32px 0 0;font-family:Arial,sans-serif;font-size:12px;color:#565C6E">
${CONTACT_DETAILS.company}, ${CONTACT_DETAILS.address} · NIP ${CONTACT_DETAILS.nip}<br>
${CONTACT_DETAILS.email} · ${CONTACT_DETAILS.phone}<br>
Wiadomość dotyczy zamówienia złożonego w serwisie envelopes.pl.</p>
</td></tr></table></td></tr></table></body></html>`;
}

function itemsTable(order: Order): string {
  const rows = order.items
    .map(
      (item) => `<tr>
<td style="padding:8px 0;border-bottom:1px solid #E3D9C4">${item.name}<br>
<span style="font-family:monospace;font-size:13px;color:#565C6E">${item.price.quantity} szt. × ${formatPrice(
        item.price.unitTotal
      )}</span></td>
<td align="right" style="padding:8px 0;border-bottom:1px solid #E3D9C4;font-family:monospace">${formatPrice(
        item.price.gross
      )}</td></tr>`
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;font-size:14px">
${rows}
<tr><td style="padding:8px 0">Dostawa</td><td align="right" style="padding:8px 0;font-family:monospace">${formatPrice(
    order.totals.deliveryGross
  )}</td></tr>
<tr><td style="padding:8px 0;font-weight:bold">Razem brutto</td><td align="right" style="padding:8px 0;font-family:monospace;font-weight:bold">${formatPrice(
    order.totals.gross
  )}</td></tr></table>`;
}

/** Potwierdzenie zamówienia — dwa warianty wg pkt 1.12. */
export function orderConfirmationEmail(order: Order): EmailPayload {
  const visualizationNote = order.requiresVisualization
    ? `<p style="background:#F3E1DE;border-left:3px solid #7A2A2E;padding:12px 16px;margin:16px 0">
Zamówienie obejmuje nadruk lub personalizację. Wkrótce otrzymają Państwo e-mail z wizualizacją projektu do akceptacji — produkcja ruszy po jej zatwierdzeniu.</p>`
    : '';

  if (isGatewayPayment(order.paymentMethod)) {
    return {
      to: order.customer.email,
      subject: `Płatność przyjęta — zamówienie ${order.number}`,
      html: shell(
        'Płatność przyjęta',
        `<p>Dziękujemy za zamówienie. Płatność została potwierdzona — przystępujemy do realizacji zamówienia
<strong style="font-family:monospace">${order.number}</strong>.</p>
${itemsTable(order)}
<p>Przewidywana data dostawy: <strong>${formatDate(order.estimatedDelivery)}</strong>.</p>
${visualizationNote}
<p><a href="${siteUrl}/zamowienia" style="color:#7A2A2E">Podgląd zamówienia w panelu klienta</a></p>`
      ),
    };
  }

  if (order.paymentMethod === 'faktura_odroczona') {
    return {
      to: order.customer.email,
      subject: `Zamówienie ${order.number} przyjęte do realizacji`,
      html: shell(
        'Zamówienie przyjęte do realizacji',
        `<p>Zamówienie <strong style="font-family:monospace">${order.number}</strong> zostało przyjęte do realizacji.
Rozliczenie następuje na podstawie faktury z odroczonym terminem płatności.</p>
${itemsTable(order)}
<p>Termin płatności faktury: <strong>${formatDate(order.paymentDueDate ?? order.estimatedDelivery)}</strong>.</p>
${visualizationNote}`
      ),
    };
  }

  // Przelew tradycyjny — proforma
  return {
    to: order.customer.email,
    subject: `Dane do przelewu — zamówienie ${order.number}`,
    html: shell(
      'Zamówienie przyjęte — czekamy na wpłatę',
      `<p>Zamówienie <strong style="font-family:monospace">${order.number}</strong> zostało zarejestrowane.
Poniżej dane do przelewu.</p>
<table role="presentation" width="100%" style="background:#F5F1E6;border-radius:8px;padding:16px;font-size:14px;margin:16px 0">
<tr><td style="padding:4px 0">Odbiorca</td><td align="right">${BANK_TRANSFER_DETAILS.odbiorca}</td></tr>
<tr><td style="padding:4px 0">Numer konta</td><td align="right" style="font-family:monospace">${BANK_TRANSFER_DETAILS.konto}</td></tr>
<tr><td style="padding:4px 0">Kwota</td><td align="right" style="font-family:monospace">${formatPrice(order.totals.gross)}</td></tr>
<tr><td style="padding:4px 0">Tytuł przelewu</td><td align="right" style="font-family:monospace">${order.number}</td></tr>
</table>
${itemsTable(order)}
<p><a href="${siteUrl}/api/dokumenty/proforma/${order.number}" style="color:#7A2A2E">Pobierz fakturę proforma (PDF)</a></p>
<p>Czekamy na zaksięgowanie wpłaty — druk ruszy dopiero po jej otrzymaniu.</p>
${visualizationNote}`
    ),
  };
}

/** E-mail z wizualizacją do akceptacji (pkt 1.11). */
export function visualizationEmail(order: Order): EmailPayload {
  const url = `${siteUrl}/akceptacja/${order.approvalToken}`;
  return {
    to: order.customer.email,
    subject: `Wizualizacja do akceptacji — zamówienie ${order.number}`,
    html: shell(
      'Wizualizacja projektu gotowa',
      `<p>Nasz grafik przygotował wizualizację do zamówienia
<strong style="font-family:monospace">${order.number}</strong>. Prosimy o jej sprawdzenie i zatwierdzenie —
produkcja ruszy po Państwa akceptacji.</p>
<table role="presentation" width="100%" style="background:#F5F1E6;border:1px dashed #E3D9C4;border-radius:8px;padding:32px;text-align:center;margin:16px 0">
<tr><td style="color:#565C6E;font-size:13px;font-family:monospace">[Podgląd wizualizacji — ${order.items[0]?.name ?? 'projekt'}]</td></tr>
</table>
<p style="text-align:center;margin:24px 0">
<a href="${url}?akcja=akceptuj" style="display:inline-block;background:#7A2A2E;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-family:Arial,sans-serif;font-weight:bold">Akceptuję projekt</a>
&nbsp;&nbsp;
<a href="${url}?akcja=uwagi" style="display:inline-block;border:1px solid #E3D9C4;color:#20242E;text-decoration:none;padding:12px 24px;border-radius:8px;font-family:Arial,sans-serif">Zgłoś uwagi</a>
</p>
<p style="font-size:13px;color:#565C6E">Link prowadzi do widoku akceptacji i nie wymaga logowania.</p>`
    ),
  };
}

/** Potwierdzenie zaksięgowania płatności. */
export function paymentConfirmedEmail(order: Order): EmailPayload {
  return {
    to: order.customer.email,
    subject: `Wpłata zaksięgowana — zamówienie ${order.number}`,
    html: shell(
      'Wpłata zaksięgowana',
      `<p>Potwierdzamy zaksięgowanie wpłaty do zamówienia
<strong style="font-family:monospace">${order.number}</strong> na kwotę
<strong style="font-family:monospace">${formatPrice(order.totals.gross)}</strong>.</p>
<p>Metoda płatności: ${PAYMENT_METHOD_LABEL[order.paymentMethod]}.</p>
<p>${
        order.requiresVisualization && order.visualizationStatus !== 'zaakceptowano'
          ? 'Do rozpoczęcia produkcji potrzebna jest jeszcze akceptacja wizualizacji projektu.'
          : 'Zamówienie zostało skierowane do produkcji.'
      }</p>`
    ),
  };
}

/** Powiadomienie o zmianie statusu zamówienia. */
export function statusChangeEmail(order: Order, statusLabel: string): EmailPayload {
  return {
    to: order.customer.email,
    subject: `Zamówienie ${order.number} — status: ${statusLabel}`,
    html: shell(
      `Status zamówienia: ${statusLabel}`,
      `<p>Status zamówienia <strong style="font-family:monospace">${order.number}</strong>
został zmieniony na <strong>${statusLabel}</strong>.</p>
<p><a href="${siteUrl}/zamowienia/${order.number}" style="color:#7A2A2E">Szczegóły zamówienia</a></p>`
    ),
  };
}

/** Wiadomość z formularza kontaktowego — trafia do BOK. */
export function contactEmail(data: {
  name: string;
  company?: string;
  email: string;
  phone?: string;
  topic: string;
  message: string;
  quantity?: string;
}): EmailPayload {
  return {
    to: process.env.BREVO_SENDER_EMAIL ?? 'kontakt@envelopes.pl',
    subject: `Formularz kontaktowy: ${data.topic}`,
    html: shell(
      'Nowa wiadomość z formularza',
      `<p><strong>Od:</strong> ${data.name}${data.company ? ` (${data.company})` : ''}<br>
<strong>E-mail:</strong> ${data.email}<br>
${data.phone ? `<strong>Telefon:</strong> ${data.phone}<br>` : ''}
${data.quantity ? `<strong>Szacowana ilość:</strong> ${data.quantity} szt.<br>` : ''}
<strong>Temat:</strong> ${data.topic}</p>
<p>${data.message.replace(/\n/g, '<br>')}</p>`
    ),
  };
}
