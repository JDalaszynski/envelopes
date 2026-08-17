import 'server-only';

import { personalizationScope } from './catalog';
import { formatPrice, formatDate } from './pricing';
import {
  BANK_TRANSFER_DETAILS,
  CONTACT_DETAILS,
  PAYMENT_METHOD_LABEL,
  isGatewayPayment,
} from './orders';
import { SITE_URL } from './seo';
import { readLocalFile } from './storage';
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
  attachment?: { url?: string; content?: string; name: string }[];
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
        .slice(0, 600)}\n  Załączniki: ${payload.attachment?.length ?? 0}\n`
    );
    return { sent: false, reason: 'BREVO_API_KEY nie jest ustawiony — e-mail zapisany w logu serwera.' };
  }

  try {
    const body: Record<string, unknown> = {
      sender: SENDER,
      to: [{ email: payload.to }],
      subject: payload.subject,
      htmlContent: payload.html,
    };
    if (payload.attachment && payload.attachment.length > 0) {
      body.attachment = payload.attachment;
    }

    const res = await brevoFetch('/smtp/email', body);
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
  return `<!doctype html><html lang="pl"><body style="margin:0;background:#f4f2ec;padding:32px 16px;font-family:Georgia,serif;color:#1f2430">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #dcd8cc;border-radius:14px;padding:32px">
<tr><td>
<p style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#575e6e;margin:0 0 8px;font-family:Arial,sans-serif">Envelopes</p>
<h1 style="font-size:24px;line-height:1.25;margin:0 0 16px">${title}</h1>
<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#1f2430">${body}</div>
<p style="margin:32px 0 0;font-family:Arial,sans-serif;font-size:12px;color:#575e6e">
${CONTACT_DETAILS.company}, ${CONTACT_DETAILS.address} · NIP ${CONTACT_DETAILS.nip}<br>
${CONTACT_DETAILS.email} · ${CONTACT_DETAILS.phone}<br>
Wiadomość dotyczy zamówienia złożonego w serwisie envelopes.pl.</p>
</td></tr></table></td></tr></table></body></html>`;
}

function itemsTable(order: Order): string {
  const rows = order.items
    .map((item) => {
      const speed = item.config.shippingSpeed === 'ekspres' ? 'Tryb ekspresowy' : 'Tryb standardowy';
      return `<tr>
<td style="padding:8px 0;border-bottom:1px solid #dcd8cc">${item.name}<br>
<span style="font-family:monospace;font-size:13px;color:#575e6e">${item.price.quantity} szt. × ${formatPrice(
        item.price.unitTotal
      )} | Czas realizacji: ${speed}</span></td>
<td align="right" style="padding:8px 0;border-bottom:1px solid #dcd8cc;font-family:monospace">${formatPrice(
        item.price.gross
      )}</td></tr>`;
    })
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
<p><a href="${siteUrl}/zamowienia" style="color:#2a4e7e">Podgląd zamówienia w panelu klienta</a></p>`
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
<p>Termin płatności faktury: <strong>${formatDate(order.paymentDueDate ?? order.estimatedDelivery)}</strong>.</p>`
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
<table role="presentation" width="100%" style="background:#f4f2ec;border-radius:8px;padding:16px;font-size:14px;margin:16px 0">
<tr><td style="padding:4px 0">Odbiorca</td><td align="right">${BANK_TRANSFER_DETAILS.odbiorca}</td></tr>
<tr><td style="padding:4px 0">Numer konta</td><td align="right" style="font-family:monospace">${BANK_TRANSFER_DETAILS.konto}</td></tr>
<tr><td style="padding:4px 0">Kwota</td><td align="right" style="font-family:monospace">${formatPrice(order.totals.gross)}</td></tr>
<tr><td style="padding:4px 0">Tytuł przelewu</td><td align="right" style="font-family:monospace">${order.number}</td></tr>
</table>
${itemsTable(order)}
<p><a href="${siteUrl}/api/dokumenty/proforma/${order.number}" style="color:#2a4e7e">Pobierz fakturę proforma (PDF)</a></p>
<p>Czekamy na zaksięgowanie wpłaty — druk ruszy dopiero po jej otrzymaniu.</p>`
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
<table role="presentation" width="100%" style="background:#f4f2ec;border:1px dashed #dcd8cc;border-radius:8px;padding:32px;text-align:center;margin:16px 0">
<tr><td style="color:#575e6e;font-size:13px;font-family:monospace">[Podgląd wizualizacji — ${order.items[0]?.name ?? 'projekt'}]</td></tr>
</table>
<p style="text-align:center;margin:24px 0">
<a href="${url}?akcja=akceptuj" style="display:inline-block;background:#2a4e7e;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-family:Arial,sans-serif;font-weight:bold">Akceptuję projekt</a>
&nbsp;&nbsp;
<a href="${url}?akcja=uwagi" style="display:inline-block;border:1px solid #dcd8cc;color:#1f2430;text-decoration:none;padding:12px 24px;border-radius:8px;font-family:Arial,sans-serif">Zgłoś uwagi</a>
</p>
<p style="font-size:13px;color:#575e6e">Link prowadzi do widoku akceptacji i nie wymaga logowania.</p>`
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

export function statusChangeEmail(order: Order, statusLabel: string): EmailPayload {
  let customMessage = '';

  if (order.status === 'czeka_na_akceptacje') {
    customMessage = `
<div style="background:#f4f2ec;border-left:3px solid #2a4e7e;padding:16px 20px;margin:24px 0;border-radius:0 8px 8px 0;">
  <p style="margin:0 0 8px;font-weight:600;color:#2a4e7e;">Projekt graficzny jest już gotowy!</p>
  <p style="margin:0;font-size:14px;line-height:1.5;color:#575e6e;">Nasz grafik przygotował wizualizację i wysłał ją do Państwa w osobnej wiadomości. Bardzo prosimy o rzut okiem i odpowiedź bezpośrednio na tamtego e-maila (z akceptacją lub uwagami), abyśmy mogli bezzwłocznie ruszyć z drukiem.</p>
</div>`;
  } else if (order.status === 'gotowe_do_wysylki') {
    customMessage = `
<div style="margin:24px 0;">
  <p style="margin:0;font-size:15px;line-height:1.5;">Paczka została starannie spakowana i obecnie oczekuje na odbiór przez kuriera. Już niebawem wyruszy w drogę!</p>
</div>`;
  }

  return {
    to: order.customer.email,
    subject: `Zamówienie ${order.number} — status: ${statusLabel}`,
    html: shell(
      `Status zamówienia: ${statusLabel}`,
      `<p>Status zamówienia <strong style="font-family:monospace">${order.number}</strong>
został zmieniony na <strong>${statusLabel}</strong>.</p>
${customMessage}
<p><a href="${siteUrl}/zamowienia/${order.number}" style="color:#2a4e7e;font-weight:bold;">Szczegóły zamówienia</a></p>`
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

/** Powiadomienie do obsługi sklepu o nowym zamówieniu. */
export async function adminNewOrderEmail(order: Order): Promise<EmailPayload> {
  const isPaid = order.paymentStatus === 'oplacone';
  const paymentStatusText = isPaid
    ? '<strong style="color: green;">Opłacone</strong>'
    : '<strong style="color: #d9534f;">Nieopłacone (oczekuje)</strong>';

  const attachment: { url?: string; content?: string; name: string }[] = [];
  let filesHtml = '';

  for (const [index, item] of order.items.entries()) {
    const posNum = index + 1;
    const safeName = item.name.replace(/[^a-zA-Z0-9_]/g, '_');
    let hasFiles = false;
    let itemHtml = `<h4 style="margin: 16px 0 8px;">Pozycja ${posNum}: ${item.name}</h4><ul style="margin:0 0 16px;padding-left:20px;">`;

    for (const [fIdx, file] of item.config.printFiles.entries()) {
      if (file.url) {
        const name = `Pozycja_${posNum}_Nadruk_${fIdx + 1}_${safeName}${file.ext}`;
        const absoluteUrl = file.url.startsWith('/') ? `${siteUrl}${file.url}` : file.url;
        if (absoluteUrl.startsWith('https://')) {
          attachment.push({ url: absoluteUrl, name });
        } else if (file.path) {
          const buffer = await readLocalFile(file.path);
          if (buffer) {
            attachment.push({ content: buffer.toString('base64'), name });
          }
        }
        itemHtml += `<li><a href="${absoluteUrl}">Nadruk ${fIdx + 1} (${name})</a></li>`;
        hasFiles = true;
      }
    }

    const pFile = item.config.personalizationFile;
    if (pFile && pFile.url) {
      const name = `Pozycja_${posNum}_Personalizacja_${safeName}${pFile.ext}`;
      const absoluteUrl = pFile.url.startsWith('/') ? `${siteUrl}${pFile.url}` : pFile.url;
      if (absoluteUrl.startsWith('https://')) {
        attachment.push({ url: absoluteUrl, name });
      } else if (pFile.path) {
        const buffer = await readLocalFile(pFile.path);
        if (buffer) {
          attachment.push({ content: buffer.toString('base64'), name });
        }
      }
      itemHtml += `<li><a href="${absoluteUrl}">Plik personalizacji (${name})</a></li>`;
      hasFiles = true;
    }

    if (item.config.personalization) {
      itemHtml += `<li><strong>Zakres personalizacji:</strong> ${personalizationScope(
        item.config.personalizationScope
      ).label.toLowerCase()}</li>`;
      hasFiles = true;
    }

    if (item.config.personalizationText) {
      itemHtml += `<li><strong>Tekst personalizacji:</strong> ${item.config.personalizationText}</li>`;
      hasFiles = true;
    }

    if (item.config.printNotes) {
      itemHtml += `<li><strong>Uwagi do druku:</strong> ${item.config.printNotes}</li>`;
      hasFiles = true;
    }

    itemHtml += `</ul>`;
    if (hasFiles) {
      filesHtml += itemHtml;
    }
  }

  const filesSection = filesHtml
    ? `<div style="margin-top:32px;border-top:1px solid #dcd8cc;padding-top:16px;">
         <h3 style="margin:0 0 8px;">Pliki do zamówienia (nadruki / personalizacja)</h3>
         <p style="font-size:13px;color:#575e6e;margin-bottom:16px;">Pliki zostały dołączone jako załączniki do tego e-maila. W przypadku bardzo dużych plików lub problemów z załącznikami, użyj poniższych bezpiecznych linków do bezpośredniego pobrania z serwera.</p>
         ${filesHtml}
       </div>`
    : '';

  const customer = order.customer;
  const address = customer.isCompany
    ? `${customer.firma}<br>NIP: ${customer.nip}<br>${customer.ulica}, ${customer.kodPocztowy} ${customer.miasto}`
    : `${customer.imie} ${customer.nazwisko}<br>${customer.ulica}, ${customer.kodPocztowy} ${customer.miasto}`;
    
  const deliveryAddress = customer.deliveryDifferent
    ? `${customer.deliveryUlica}, ${customer.deliveryKodPocztowy} ${customer.deliveryMiasto}`
    : `${customer.ulica}, ${customer.kodPocztowy} ${customer.miasto}`;
    
  const delivery = order.delivery.method === 'kurier'
    ? `Kurier (dostawa pod adres: ${deliveryAddress})`
    : `Paczkomat (kod: ${order.delivery.point?.name || 'Brak kodu'})`;

  return {
    to: process.env.BREVO_SENDER_EMAIL ?? 'kontakt@envelopes.pl',
    subject: `Nowe zamówienie ${order.number} w systemie`,
    attachment,
    html: shell(
      `Nowe zamówienie: ${order.number}`,
      `<p>W sklepie złożono nowe zamówienie.</p>

<table role="presentation" width="100%" style="background:#f4f2ec;border-radius:8px;padding:16px;font-size:14px;margin:16px 0">
<tr><td style="padding:4px 0">Status płatności</td><td align="right">${paymentStatusText}</td></tr>
<tr><td style="padding:4px 0">Metoda płatności</td><td align="right">${PAYMENT_METHOD_LABEL[order.paymentMethod]}</td></tr>
</table>

${itemsTable(order)}

<h3 style="margin: 24px 0 8px;">Dane zamawiającego</h3>
<p style="margin:0;font-size:14px;line-height:1.5;">
  <strong>Imię i nazwisko:</strong> ${customer.imie} ${customer.nazwisko}<br>
  <strong>Email:</strong> <a href="mailto:${customer.email}">${customer.email}</a><br>
  <strong>Telefon:</strong> ${customer.telefon}
</p>

<h3 style="margin: 24px 0 8px;">Dane do faktury / rachunku</h3>
<p style="margin:0;font-size:14px;line-height:1.5;">
  ${address}
</p>

<h3 style="margin: 24px 0 8px;">Dostawa</h3>
<p style="margin:0;font-size:14px;line-height:1.5;">
  ${delivery}
</p>

${filesSection}

<p style="margin-top:32px;"><a href="${siteUrl}/admin/zamowienia/${order.number}" style="display:inline-block;padding:12px 24px;background:#2a4e7e;color:#fff;text-decoration:none;border-radius:4px;font-weight:bold;">Przejdź do panelu administracyjnego</a></p>`
    ),
  };
}

/** E-mail weryfikacyjny (przy standardowej rejestracji konta). */
export function verificationEmail(email: string, link: string): EmailPayload {
  return {
    to: email,
    subject: 'Potwierdź swój adres e-mail — Envelopes',
    html: shell(
      'Weryfikacja adresu e-mail',
      `<p>Dziękujemy za założenie konta w naszym sklepie. Aby upewnić się, że adres e-mail jest poprawny, prosimy o jego weryfikację klikając w poniższy link:</p>
<p style="text-align:center;margin:32px 0;">
  <a href="${link}" style="display:inline-block;background:#2a4e7e;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-family:Arial,sans-serif;font-weight:bold;font-size:16px;">Potwierdź adres e-mail</a>
</p>
<p style="font-size:13px;color:#575e6e;word-break:break-all;">
  Jeśli przycisk nie działa, skopiuj ten link do przeglądarki:<br>
  <a href="${link}" style="color:#2a4e7e;">${link}</a>
</p>
<p>Jeśli to nie Ty zakładałeś konto, po prostu zignoruj tę wiadomość.</p>`
    ),
  };
}

/** Powitanie nowo zarejestrowanego użytkownika. */
export function welcomeEmail(email: string, displayName: string | null): EmailPayload {
  const nameGreeting = displayName ? `Cześć ${displayName}` : 'Cześć';
  
  return {
    to: email,
    subject: 'Witamy w Envelopes!',
    html: shell(
      'Witamy w świecie pięknych kopert',
      `<p><strong>${nameGreeting},</strong></p>
<p>Bardzo się cieszymy, że dołączyłeś do grona klientów <strong>Envelopes</strong>. Z Twoim nowym kontem zakupy będą jeszcze szybsze i przyjemniejsze!</p>

<div style="background:#f4f2ec;border-left:3px solid #2a4e7e;padding:16px 20px;margin:24px 0;border-radius:0 8px 8px 0;">
  <p style="margin:0 0 8px;font-weight:600;color:#2a4e7e;">Korzyści z Twojego konta:</p>
  <ul style="margin:0;padding-left:20px;font-size:14px;line-height:1.6;color:#575e6e;">
    <li>Szybsze zamawianie — Twoje dane do wysyłki i faktury są już zapisane.</li>
    <li>Dostęp do historii zamówień i projektów do akceptacji.</li>
    <li>Wygodne ponawianie zamówień za pomocą jednego kliknięcia.</li>
  </ul>
</div>

<p>Zachęcamy do uzupełnienia swoich danych profilowych, co przyspieszy proces przyszłych zakupów.</p>

<p style="text-align:center;margin:32px 0;">
  <a href="${siteUrl}/profil" style="display:inline-block;background:#2a4e7e;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-family:Arial,sans-serif;font-weight:bold;font-size:16px;">Przejdź do profilu</a>
</p>

<p>W razie pytań, po prostu odpisz na tego e-maila — chętnie pomożemy!</p>`
    ),
  };
}
