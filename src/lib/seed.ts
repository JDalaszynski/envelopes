import { calculatePrice, DEFAULT_PRICING, round2 } from './pricing';
import { buildProductName } from './product-name';
import { buildOrderNumber, generateApprovalToken } from './orders';
import type { CartItem, EnvelopeConfig, Order } from './types';

/**
 * Dane demonstracyjne — zestaw zamówień pokrywający wszystkie ścieżki
 * procesu (pkt 1.10–1.12), żeby panel klienta i panel Admina miały co pokazać
 * zanim spłyną prawdziwe zamówienia. Używane tylko w trybie DEV FALLBACK;
 * przy podłączonym Firestore kolekcja `orders` startuje pusta.
 */

export const DEMO_USER = {
  uid: 'demo-klient',
  email: 'klient@przyklad.pl',
};

export const DEMO_ADMIN = {
  uid: 'demo-admin',
  email: 'admin@envelopes.pl',
};

function makeItem(config: EnvelopeConfig): CartItem {
  return {
    id: `item-${Math.random().toString(36).slice(2, 10)}`,
    config,
    name: buildProductName(config),
    price: calculatePrice(config, DEFAULT_PRICING),
    addedAt: new Date().toISOString(),
  };
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function daysAhead(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function baseConfig(partial: Partial<EnvelopeConfig>): EnvelopeConfig {
  return {
    format: 'DL',
    color: 'granatowy',
    quantity: 100,
    print: false,
    printFiles: [],
    personalization: false,
    shippingSpeed: 'standard',
    ...partial,
  };
}

function totals(items: CartItem[], deliveryGross: number) {
  const itemsGross = round2(items.reduce((sum, i) => sum + i.price.gross, 0));
  const gross = round2(itemsGross + deliveryGross);
  const net = round2(gross / (1 + DEFAULT_PRICING.vatRate));
  return {
    itemsGross,
    deliveryGross,
    gross,
    net,
    vat: round2(gross - net),
  };
}

export function seedOrders(): Order[] {
  const now = new Date();

  /* 1. Bez nadruku, opłacone przez bramkę → pomija akceptację wizualizacji */
  const items1 = [makeItem(baseConfig({ format: 'DL', color: 'granatowy', quantity: 250 }))];
  const order1: Order = {
    number: buildOrderNumber(new Date(daysAgo(9)), 12),
    createdAt: daysAgo(9),
    updatedAt: daysAgo(2),
    userId: DEMO_USER.uid,
    customer: {
      email: DEMO_USER.email,
      telefon: '600 100 200',
      imie: 'Anna',
      nazwisko: 'Kowalska',
      isCompany: true,
      firma: 'Kancelaria Kowalska i Wspólnicy',
      nip: '5252445997',
      ulica: 'ul. Miodowa 14/3',
      kodPocztowy: '00-246',
      miasto: 'Warszawa',
      deliveryDifferent: false,
    },
    delivery: { method: 'kurier', cost: DEFAULT_PRICING.delivery.kurier, point: null },
    items: items1,
    totals: totals(items1, DEFAULT_PRICING.delivery.kurier),
    paymentMethod: 'p24',
    paymentStatus: 'oplacone',
    p24Reference: 'P24-8842137',
    status: 'zrealizowane',
    requiresVisualization: false,
    visualizationStatus: 'brak',
    visualizations: [],
    approvalToken: generateApprovalToken(),
    estimatedDelivery: daysAgo(2),
    trackingNumber: '00159000123456789012',
    marketingConsent: true,
    history: [
      { at: daysAgo(9), by: 'system', action: 'Zamówienie złożone' },
      { at: daysAgo(9), by: 'Przelewy24', action: 'Płatność potwierdzona' },
      { at: daysAgo(7), by: 'admin@envelopes.pl', action: 'Status: Do druku' },
      { at: daysAgo(2), by: 'admin@envelopes.pl', action: 'Status: Zrealizowane' },
    ],
  };

  /* 2. Z nadrukiem + personalizacją, przelew tradycyjny, czeka na akceptację
        — wizualizacja wysłana mimo braku wpłaty (pkt 1.12) */
  const items2 = [
    makeItem(
      baseConfig({
        format: 'K4',
        color: 'biala-perlowa',
        quantity: 300,
        print: true,
        printFiles: [
          {
            id: 'f1',
            name: 'logo-kancelaria-2026.pdf',
            size: 2411520,
            ext: 'pdf',
            status: 'przeslano',
          },
        ],
        printNotes: 'Logo wyśrodkowane na klapce, tłoczenie bez laminatu.',
        personalization: true,
        personalizationMethod: 'szablon',
        personalizationFile: {
          id: 'f2',
          name: 'adresy-300.xlsx',
          size: 48210,
          ext: 'xlsx',
          status: 'przeslano',
        },
        shippingSpeed: 'ekspres',
      })
    ),
  ];
  const order2: Order = {
    number: buildOrderNumber(new Date(daysAgo(3)), 4),
    createdAt: daysAgo(3),
    updatedAt: daysAgo(1),
    userId: DEMO_USER.uid,
    customer: {
      email: DEMO_USER.email,
      telefon: '600 100 200',
      imie: 'Anna',
      nazwisko: 'Kowalska',
      isCompany: true,
      firma: 'Kancelaria Kowalska i Wspólnicy',
      nip: '5252445997',
      ulica: 'ul. Miodowa 14/3',
      kodPocztowy: '00-246',
      miasto: 'Warszawa',
      deliveryDifferent: false,
    },
    delivery: { method: 'kurier', cost: DEFAULT_PRICING.delivery.kurier, point: null },
    items: items2,
    totals: totals(items2, DEFAULT_PRICING.delivery.kurier),
    paymentMethod: 'przelew',
    paymentStatus: 'oczekuje',
    p24Reference: null,
    status: 'czeka_na_akceptacje',
    requiresVisualization: true,
    visualizationStatus: 'oczekuje',
    visualizations: [
      {
        id: 'v1',
        version: 1,
        file: {
          id: 'vf1',
          name: 'wizualizacja-K4-v1.pdf',
          size: 1840000,
          ext: 'pdf',
          status: 'przeslano',
        },
        sentAt: daysAgo(1),
        status: 'oczekuje',
      },
    ],
    approvalToken: 'demo-token-akceptacja',
    estimatedDelivery: daysAhead(2),
    marketingConsent: false,
    history: [
      { at: daysAgo(3), by: 'system', action: 'Zamówienie złożone' },
      { at: daysAgo(3), by: 'system', action: 'Wysłano fakturę proforma' },
      { at: daysAgo(2), by: 'admin@envelopes.pl', action: 'Status: W trakcie' },
      {
        at: daysAgo(1),
        by: 'admin@envelopes.pl',
        action: 'Dołączono wizualizację (wersja 1)',
        detail: 'Status: Czeka na akceptację',
      },
    ],
  };

  /* 3. Faktura z odroczonym terminem — produkcja rusza bez wpłaty */
  const items3 = [
    makeItem(baseConfig({ format: 'C6', color: 'ecru', quantity: 500, print: true,
      printFiles: [{ id: 'f3', name: 'nadruk-eventowy.ai', size: 5120000, ext: 'ai', status: 'przeslano' }],
    })),
  ];
  const order3: Order = {
    number: buildOrderNumber(new Date(daysAgo(5)), 7),
    createdAt: daysAgo(5),
    updatedAt: daysAgo(1),
    userId: 'demo-firma',
    customer: {
      email: 'zakupy@eventmakers.pl',
      telefon: '512 300 400',
      imie: 'Marek',
      nazwisko: 'Zieliński',
      isCompany: true,
      firma: 'Event Makers sp. z o.o.',
      nip: '7010012345',
      ulica: 'al. Jerozolimskie 100',
      kodPocztowy: '00-807',
      miasto: 'Warszawa',
      deliveryDifferent: false,
    },
    delivery: { method: 'kurier', cost: DEFAULT_PRICING.delivery.kurier, point: null },
    items: items3,
    totals: totals(items3, DEFAULT_PRICING.delivery.kurier),
    paymentMethod: 'faktura_odroczona',
    paymentStatus: 'oczekuje',
    paymentDueDate: daysAhead(9),
    p24Reference: null,
    status: 'do_druku',
    requiresVisualization: true,
    visualizationStatus: 'zaakceptowano',
    visualizations: [
      {
        id: 'v2',
        version: 1,
        file: { id: 'vf2', name: 'wizualizacja-C6-v1.pdf', size: 990000, ext: 'pdf', status: 'przeslano' },
        sentAt: daysAgo(3),
        status: 'zaakceptowano',
        respondedAt: daysAgo(2),
      },
    ],
    approvalToken: generateApprovalToken(),
    estimatedDelivery: daysAhead(1),
    marketingConsent: true,
    history: [
      { at: daysAgo(5), by: 'system', action: 'Zamówienie złożone' },
      { at: daysAgo(3), by: 'admin@envelopes.pl', action: 'Dołączono wizualizację (wersja 1)' },
      { at: daysAgo(2), by: 'klient', action: 'Wizualizacja zaakceptowana' },
      { at: daysAgo(1), by: 'admin@envelopes.pl', action: 'Status: Do druku' },
    ],
  };

  /* 4. Nowe zamówienie z nadrukiem, opłacone kartą — czeka na wizualizację */
  const items4 = [
    makeItem(
      baseConfig({
        format: 'DL',
        color: 'czarny',
        quantity: 60,
        print: true,
        printFiles: [{ id: 'f4', name: 'monogram.svg', size: 128400, ext: 'svg', status: 'weryfikacja' }],
        printNotes: 'Monogram w kolorze złotym, prawy dolny róg.',
        shippingSpeed: 'ekspres',
      })
    ),
  ];
  const order4: Order = {
    number: buildOrderNumber(now, 1),
    createdAt: daysAgo(0),
    updatedAt: daysAgo(0),
    userId: null,
    customer: {
      email: 'biuro@studio-graficzne.pl',
      telefon: '790 800 900',
      imie: 'Katarzyna',
      nazwisko: 'Nowak',
      isCompany: false,
      ulica: 'ul. Lipowa 3',
      kodPocztowy: '30-001',
      miasto: 'Kraków',
      deliveryDifferent: false,
    },
    delivery: { method: 'kurier', cost: DEFAULT_PRICING.delivery.kurier, point: null },
    items: items4,
    totals: totals(items4, DEFAULT_PRICING.delivery.kurier),
    paymentMethod: 'blik',
    paymentStatus: 'oplacone',
    p24Reference: 'P24-9012884',
    status: 'nowe',
    requiresVisualization: true,
    visualizationStatus: 'brak',
    visualizations: [],
    approvalToken: generateApprovalToken(),
    estimatedDelivery: daysAhead(2),
    marketingConsent: false,
    history: [
      { at: daysAgo(0), by: 'system', action: 'Zamówienie złożone' },
      { at: daysAgo(0), by: 'Przelewy24', action: 'Płatność potwierdzona' },
    ],
  };

  return [order4, order2, order3, order1];
}
