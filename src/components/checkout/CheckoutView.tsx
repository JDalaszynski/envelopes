'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { EnvelopePlaceholder } from '@/components/ui/EnvelopePlaceholder';
import { useCart } from '@/components/providers/CartProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { DEFAULT_PRICING, DELIVERY_COST, formatPrice, round2 } from '@/lib/pricing';
import { PAYMENT_METHOD_LABEL } from '@/lib/orders';
import type { CustomerData, PaymentMethod } from '@/lib/types';

const EMPTY_CUSTOMER: CustomerData = {
  email: '',
  telefon: '',
  imie: '',
  nazwisko: '',
  isCompany: false,
  firma: '',
  nip: '',
  ulica: '',
  kodPocztowy: '',
  miasto: '',
  deliveryDifferent: false,
};

type FieldName =
  | 'email'
  | 'telefon'
  | 'imie'
  | 'nazwisko'
  | 'haslo'
  | 'firma'
  | 'ulica'
  | 'kodPocztowy'
  | 'miasto'
  | 'deliveryUlica'
  | 'deliveryKodPocztowy'
  | 'deliveryMiasto'
  | 'regulamin';

/**
 * Checkout jako jeden ekran (bez kroków).
 *
 * Decyzje UX:
 * — cała treść formularza jest widoczna od razu, więc klient od pierwszej
 *   chwili wie, ile pracy przed nim; brak „ukrytych" kroków to mniej porzuceń,
 * — walidacja pojawia się po opuszczeniu pola, nie w trakcie pisania,
 * — po nieudanej próbie wysyłki fokus i przewinięcie trafiają na pierwsze
 *   błędne pole, a nad przyciskiem pojawia się lista braków,
 * — podsumowanie zamówienia jest przyklejone i widoczne przez cały czas,
 * — pola mają atrybuty autocomplete, więc autouzupełnianie przeglądarki działa.
 */
export function CheckoutView() {
  const router = useRouter();
  const { items, itemsGross, clear, ready } = useCart();
  const { user, login, register, loginWithGoogle, getToken } = useAuth();

  const [customer, setCustomer] = useState<CustomerData>(EMPTY_CUSTOMER);
  const [payment, setPayment] = useState<PaymentMethod>('p24');

  const [showLogin, setShowLogin] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState('');

  const [terms, setTerms] = useState(false);

  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);


  const refs = useRef<Partial<Record<FieldName, HTMLElement | null>>>({});
  const patch = (changes: Partial<CustomerData>) => setCustomer((prev) => ({ ...prev, ...changes }));

  /* Dane zalogowanego klienta uzupełniają formularz z profilu. */
  useEffect(() => {
    if (!user) return;
    setShowLogin(false);
    setCustomer((prev) => ({ ...prev, email: user.email }));
    (async () => {
      const token = await getToken();
      if (!token) return;
      const res = await fetch('/api/profil', { headers: { authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const json = await res.json();
      const address = json.profile?.addresses?.find((a: { isDefault: boolean }) => a.isDefault)?.data;
      setCustomer((prev) => ({
        ...prev,
        ...(address ?? {}),
        email: user.email,
        imie: json.profile?.imie || prev.imie,
        nazwisko: json.profile?.nazwisko || prev.nazwisko,
        telefon: json.profile?.telefon || prev.telefon,
        ...(json.profile?.accountType === 'firmowe'
          ? { isCompany: true, firma: json.profile.firma ?? '', nip: json.profile.nip ?? '' }
          : {}),
      }));
    })();
  }, [user, getToken]);

  /* ── Walidacja ───────────────────────────────────────────── */

  const validators: Record<FieldName, () => string | null> = useMemo(
    () => ({
      email: () =>
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(customer.email)
          ? null
          : 'Prosimy podać poprawny adres e-mail — wyślemy na niego potwierdzenie.',
      telefon: () =>
        customer.telefon.replace(/\D/g, '').length >= 9
          ? null
          : 'Prosimy podać numer telefonu — może go potrzebować kurier.',
      imie: () => (customer.imie.trim() ? null : 'Prosimy podać imię.'),
      nazwisko: () => (customer.nazwisko.trim() ? null : 'Prosimy podać nazwisko.'),
      haslo: () =>
        !createAccount || user || password.length >= 6
          ? null
          : 'Hasło musi mieć co najmniej 6 znaków.',
      firma: () =>
        !customer.isCompany || customer.firma?.trim() ? null : 'Prosimy podać nazwę firmy.',
      ulica: () => (customer.ulica.trim() ? null : 'Prosimy podać ulicę i numer.'),
      kodPocztowy: () =>
        /^\d{2}-\d{3}$/.test(customer.kodPocztowy) ? null : 'Kod pocztowy w formacie 00-000.',
      miasto: () => (customer.miasto.trim() ? null : 'Prosimy podać miejscowość.'),
      deliveryUlica: () =>
        !customer.deliveryDifferent || customer.deliveryUlica?.trim()
          ? null
          : 'Prosimy podać ulicę dostawy.',
      deliveryKodPocztowy: () =>
        !customer.deliveryDifferent || /^\d{2}-\d{3}$/.test(customer.deliveryKodPocztowy ?? '')
          ? null
          : 'Kod pocztowy w formacie 00-000.',
      deliveryMiasto: () =>
        !customer.deliveryDifferent || customer.deliveryMiasto?.trim()
          ? null
          : 'Prosimy podać miejscowość dostawy.',
      regulamin: () => (terms ? null : 'Do złożenia zamówienia wymagana jest akceptacja regulaminu.'),
    }),
    [customer, terms, createAccount, password, user]
  );

  const ORDER: FieldName[] = [
    'email',
    'telefon',
    'imie',
    'nazwisko',
    'haslo',
    'firma',
    'ulica',
    'kodPocztowy',
    'miasto',
    'deliveryUlica',
    'deliveryKodPocztowy',
    'deliveryMiasto',
    'regulamin',
  ];

  function validateField(name: FieldName) {
    const message = validators[name]();
    setErrors((prev) => ({ ...prev, [name]: message ?? undefined }));
    return message;
  }

  function blur(name: FieldName) {
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name);
  }

  /** Błąd pokazujemy dopiero, gdy pole zostało opuszczone albo po próbie wysyłki. */
  const errorFor = (name: FieldName) =>
    (touched[name] || submitAttempted) && errors[name] ? errors[name] : undefined;

  const fieldProps = (name: FieldName) => ({
    'aria-invalid': Boolean(errorFor(name)),
    'aria-describedby': errorFor(name) ? `${name}-error` : undefined,
    onBlur: () => blur(name),
  });

  /* ── Podsumowanie ────────────────────────────────────────── */

  const gross = round2(itemsGross + DELIVERY_COST);
  const net = round2(gross / (1 + DEFAULT_PRICING.vatRate));
  const requiresApproval = items.some((i) => i.config.print || i.config.personalization);

  if (ready && items.length === 0) {
    return (
      <div className="empty-state">
        <h1 style={{ fontSize: 28 }}>Koszyk jest pusty</h1>
        <p className="muted">Nie ma czego zamawiać — najpierw prosimy wybrać koperty.</p>
        <Link href="/#konfigurator" className="btn">
          Przejdź do sklepu
        </Link>
      </div>
    );
  }

  async function handleLogin() {
    setLoginError(null);
    try {
      await login(customer.email, loginPassword);
    } catch {
      setLoginError('Nie udało się zalogować. Prosimy sprawdzić adres e-mail i hasło.');
    }
  }

  async function submitOrder() {
    setSubmitAttempted(true);
    setSubmitError(null);

    const found: Partial<Record<FieldName, string>> = {};
    for (const name of ORDER) {
      const message = validators[name]();
      if (message) found[name] = message;
    }
    setErrors(found);

    const firstInvalid = ORDER.find((name) => found[name]);
    if (firstInvalid) {
      const node = refs.current[firstInvalid];
      node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.setTimeout(() => node?.focus?.(), 350);
      return;
    }

    setSubmitting(true);
    try {
      if (createAccount && !user) {
        await register(customer.email, password, `${customer.imie} ${customer.nazwisko}`.trim());
      }

      const token = await getToken();
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          items: items.map((item) => ({ config: item.config })),
          customer,
          delivery: { method: 'kurier', cost: DELIVERY_COST, point: null },
          paymentMethod: payment,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Nie udało się złożyć zamówienia.');

      clear();

      if (json.redirectUrl) {
        window.location.href = json.redirectUrl; // przekierowanie do bramki Przelewy24
        return;
      }
      router.push(`/zamowienie/potwierdzenie/${json.order.number}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Wystąpił błąd.');
      setSubmitting(false);
    }
  }

  const paymentOptions: { id: PaymentMethod; note: string }[] = [
    { id: 'p24', note: 'Karta płatnicza lub szybki przelew. Potwierdzenie natychmiastowe.' },
    { id: 'blik', note: 'Kod z aplikacji bankowej. Potwierdzenie natychmiastowe.' },
    { id: 'przelew', note: 'Faktura proforma z danymi do przelewu. Druk rusza po zaksięgowaniu wpłaty.' },
    {
      id: 'faktura_odroczona',
      note: 'Dla instytucji i jednostek budżetowych. Termin płatności 14 dni, produkcja rusza bez oczekiwania na wpłatę.',
    },
  ];

  const missing = submitAttempted ? ORDER.filter((name) => errors[name]) : [];

  return (
    <>
      <div className="checkout-head">
        <h1>Zamówienie</h1>
      </div>

      <div className="checkout-layout">
        <form
          className="stack"
          style={{ gap: 'var(--space-5)' }}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void submitOrder();
          }}
        >
          {/* ── 1. Kontakt ── */}
          <section className="card card-lg checkout-section" aria-labelledby="sekcja-kontakt">
            <header className="checkout-section-head">
              <span className="checkout-num" aria-hidden="true">
                1
              </span>
              <div>
                <h2 id="sekcja-kontakt">Dane kontaktowe</h2>
                <p className="small muted" style={{ margin: 0 }}>
                  Na ten adres wyślemy potwierdzenie zamówienia i wizualizację do akceptacji.
                </p>
              </div>
            </header>

            {user ? (
              <p className="notice notice-success">
                Zalogowano jako <strong>{user.email}</strong> — dane uzupełniliśmy z profilu.
              </p>
            ) : (
              <p className="small muted checkout-login-hint">
                Masz konto?{' '}
                <button type="button" className="link-btn" onClick={() => setShowLogin((v) => !v)}>
                  Zaloguj się
                </button>{' '}
                — dane do faktury uzupełnią się automatycznie.
              </p>
            )}

            {!user && showLogin && (
              <div className="login-inline">
                <div className="field">
                  <label htmlFor="login-haslo">Hasło do konta {customer.email || ''}</label>
                  <input
                    id="login-haslo"
                    className="input"
                    type="password"
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>
                {loginError && <p className="field-error">{loginError}</p>}
                <div className="row">
                  <button type="button" className="btn btn-sm" onClick={() => void handleLogin()}>
                    Zaloguj się
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => void loginWithGoogle()}
                  >
                    Zaloguj przez Google
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-2" style={{ gap: 'var(--space-4)' }}>
              <Field
                name="imie"
                label="Imię"
                value={customer.imie}
                autoComplete="given-name"
                error={errorFor('imie')}
                fieldProps={fieldProps('imie')}
                refs={refs}
                onChange={(v) => patch({ imie: v })}
              />
              <Field
                name="nazwisko"
                label="Nazwisko"
                value={customer.nazwisko}
                autoComplete="family-name"
                error={errorFor('nazwisko')}
                fieldProps={fieldProps('nazwisko')}
                refs={refs}
                onChange={(v) => patch({ nazwisko: v })}
              />
              <Field
                name="email"
                label="Adres e-mail"
                type="email"
                value={customer.email}
                autoComplete="email"
                error={errorFor('email')}
                fieldProps={fieldProps('email')}
                refs={refs}
                onChange={(v) => patch({ email: v })}
              />
              <Field
                name="telefon"
                label="Telefon"
                type="tel"
                value={customer.telefon}
                autoComplete="tel"
                error={errorFor('telefon')}
                fieldProps={fieldProps('telefon')}
                refs={refs}
                onChange={(v) => patch({ telefon: v })}
              />
            </div>

            {!user && (
              <>
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={createAccount}
                    onChange={(e) => setCreateAccount(e.target.checked)}
                  />
                  <span>
                    Załóż konto, żeby śledzić to i przyszłe zamówienia. Wykorzystamy dane wpisane
                    powyżej — wystarczy ustawić hasło.
                  </span>
                </label>
                {createAccount && (
                  <Field
                    name="haslo"
                    label="Hasło"
                    type="password"
                    value={password}
                    autoComplete="new-password"
                    hint="Minimum 6 znaków."
                    error={errorFor('haslo')}
                    fieldProps={fieldProps('haslo')}
                    refs={refs}
                    onChange={setPassword}
                    style={{ maxWidth: 320 }}
                  />
                )}
              </>
            )}
          </section>

          {/* ── 2. Dane do faktury ── */}
          <section className="card card-lg checkout-section" aria-labelledby="sekcja-faktura">
            <header className="checkout-section-head">
              <span className="checkout-num" aria-hidden="true">
                2
              </span>
              <div>
                <h2 id="sekcja-faktura">Dane do faktury</h2>
                <p className="small muted" style={{ margin: 0 }}>
                  Fakturę VAT wystawiamy do każdego zamówienia — także bez numeru NIP.
                </p>
              </div>
            </header>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={customer.isCompany}
                onChange={(e) => patch({ isCompany: e.target.checked })}
              />
              <span>Kupuję jako firma</span>
            </label>

            {customer.isCompany && (
              <div className="grid grid-2" style={{ gap: 'var(--space-4)' }}>
                <div className="field">
                  <label htmlFor="nip">NIP (opcjonalnie)</label>
                  <input
                    id="nip"
                    className="input"
                    inputMode="numeric"
                    value={customer.nip ?? ''}
                    placeholder="0000000000"
                    onChange={(e) => patch({ nip: e.target.value })}
                  />
                </div>
                <Field
                  name="firma"
                  label="Nazwa firmy"
                  value={customer.firma ?? ''}
                  autoComplete="organization"
                  error={errorFor('firma')}
                  fieldProps={fieldProps('firma')}
                  refs={refs}
                  onChange={(v) => patch({ firma: v })}
                />
              </div>
            )}

            <div className="grid grid-2" style={{ gap: 'var(--space-4)' }}>
              <Field
                name="ulica"
                label="Ulica i numer"
                value={customer.ulica}
                autoComplete="street-address"
                error={errorFor('ulica')}
                fieldProps={fieldProps('ulica')}
                refs={refs}
                onChange={(v) => patch({ ulica: v })}
                style={{ gridColumn: '1 / -1' }}
              />
              <Field
                name="kodPocztowy"
                label="Kod pocztowy"
                value={customer.kodPocztowy}
                autoComplete="postal-code"
                placeholder="00-000"
                inputMode="numeric"
                error={errorFor('kodPocztowy')}
                fieldProps={fieldProps('kodPocztowy')}
                refs={refs}
                onChange={(v) => patch({ kodPocztowy: formatPostalCode(v) })}
              />
              <Field
                name="miasto"
                label="Miejscowość"
                value={customer.miasto}
                autoComplete="address-level2"
                error={errorFor('miasto')}
                fieldProps={fieldProps('miasto')}
                refs={refs}
                onChange={(v) => patch({ miasto: v })}
              />
            </div>
          </section>

          {/* ── 3. Dostawa ── */}
          <section className="card card-lg checkout-section" aria-labelledby="sekcja-dostawa">
            <header className="checkout-section-head">
              <span className="checkout-num" aria-hidden="true">
                3
              </span>
              <div>
                <h2 id="sekcja-dostawa">Dostawa</h2>
                <p className="small muted" style={{ margin: 0 }}>
                  Koszt dostawy to {formatPrice(DELIVERY_COST)} niezależnie od wybranego przewoźnika
                  i wartości zamówienia.
                </p>
              </div>
            </header>

            <div className="delivery-method">
              <span className="speed-icon" aria-hidden="true">
                <TruckIcon />
              </span>
              <span>
                <strong>Kurier</strong>
                <small>Dostawa pod wskazany adres w dniu roboczym, z powiadomieniem SMS.</small>
              </span>
              <span className="mono">{formatPrice(DELIVERY_COST)}</span>
            </div>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={customer.deliveryDifferent}
                onChange={(e) => patch({ deliveryDifferent: e.target.checked })}
              />
              <span>Wysyłka na inny adres niż na fakturze</span>
            </label>

            {customer.deliveryDifferent && (
              <div className="grid grid-2" style={{ gap: 'var(--space-4)' }}>
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="d-osoba">Odbiorca</label>
                  <input
                    id="d-osoba"
                    className="input"
                    autoComplete="name"
                    value={customer.deliveryImieNazwisko ?? ''}
                    onChange={(e) => patch({ deliveryImieNazwisko: e.target.value })}
                  />
                </div>
                <Field
                  name="deliveryUlica"
                  label="Ulica i numer"
                  value={customer.deliveryUlica ?? ''}
                  error={errorFor('deliveryUlica')}
                  fieldProps={fieldProps('deliveryUlica')}
                  refs={refs}
                  onChange={(v) => patch({ deliveryUlica: v })}
                  style={{ gridColumn: '1 / -1' }}
                />
                <Field
                  name="deliveryKodPocztowy"
                  label="Kod pocztowy"
                  value={customer.deliveryKodPocztowy ?? ''}
                  placeholder="00-000"
                  inputMode="numeric"
                  error={errorFor('deliveryKodPocztowy')}
                  fieldProps={fieldProps('deliveryKodPocztowy')}
                  refs={refs}
                  onChange={(v) => patch({ deliveryKodPocztowy: formatPostalCode(v) })}
                />
                <Field
                  name="deliveryMiasto"
                  label="Miejscowość"
                  value={customer.deliveryMiasto ?? ''}
                  error={errorFor('deliveryMiasto')}
                  fieldProps={fieldProps('deliveryMiasto')}
                  refs={refs}
                  onChange={(v) => patch({ deliveryMiasto: v })}
                />
              </div>
            )}
          </section>

          {/* ── 4. Płatność ── */}
          <section className="card card-lg checkout-section" aria-labelledby="sekcja-platnosc">
            <header className="checkout-section-head">
              <span className="checkout-num" aria-hidden="true">
                4
              </span>
              <div>
                <h2 id="sekcja-platnosc">Płatność</h2>
              </div>
            </header>

            <div className="stack" style={{ gap: 'var(--space-3)' }}>
              {paymentOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="option-card"
                  aria-pressed={payment === option.id}
                  onClick={() => setPayment(option.id)}
                >
                  <span>
                    <strong>{PAYMENT_METHOD_LABEL[option.id]}</strong>
                    <small>{option.note}</small>
                  </span>
                </button>
              ))}
            </div>

            {payment === 'przelew' && (
              <p className="notice">
                Po złożeniu zamówienia otrzymają Państwo fakturę proforma z danymi do przelewu. Druk
                rusza po zaksięgowaniu wpłaty.
              </p>
            )}
          </section>

          {/* ── 5. Zgody i potwierdzenie ── */}
          <section className="card card-lg checkout-section" aria-labelledby="sekcja-zgody">
            <header className="checkout-section-head">
              <span className="checkout-num" aria-hidden="true">
                5
              </span>
              <div>
                <h2 id="sekcja-zgody">Potwierdzenie</h2>
              </div>
            </header>

            {requiresApproval && (
              <p className="notice notice-seal">
                Zamówienie zawiera nadruk lub personalizację. Po jego złożeniu grafik przygotuje
                wizualizację i prześle ją e-mailem do akceptacji — produkcja ruszy po zatwierdzeniu
                projektu.
              </p>
            )}

            <div
              ref={(node) => {
                refs.current.regulamin = node;
              }}
              tabIndex={-1}
            >
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => {
                    setTerms(e.target.checked);
                    if (e.target.checked) setErrors((p) => ({ ...p, regulamin: undefined }));
                  }}
                />
                <span>
                  Akceptuję <Link href="/regulamin">Regulamin</Link> oraz{' '}
                  <Link href="/polityka-prywatnosci">Politykę Prywatności</Link>. Przyjmuję do
                  wiadomości, że koperty z nadrukiem i personalizacją są wykonywane według mojej
                  specyfikacji i nie podlegają prawu odstąpienia od umowy.
                </span>
              </label>
              {errorFor('regulamin') && (
                <p className="field-error" id="regulamin-error" role="alert">
                  {errorFor('regulamin')}
                </p>
              )}
            </div>

            {missing.length > 0 && (
              <div className="notice notice-error" role="alert">
                <strong>Brakuje jeszcze {missing.length} informacji:</strong>
                <ul style={{ margin: 'var(--space-2) 0 0', paddingLeft: 'var(--space-5)' }}>
                  {missing.map((name) => (
                    <li key={name}>{errors[name]}</li>
                  ))}
                </ul>
              </div>
            )}

            {submitError && (
              <p className="notice notice-error" role="alert">
                {submitError}
              </p>
            )}

            <button type="submit" className="btn btn-lg btn-block" disabled={submitting}>
              {submitting ? 'Przetwarzanie…' : `Zamawiam i płacę ${formatPrice(gross)}`}
            </button>
          </section>
        </form>

        {/* ── Podsumowanie ── */}
        <aside className="summary-panel" aria-label="Podsumowanie zamówienia">
          <span className="eyebrow">Twoje zamówienie</span>

          <ul className="checkout-items">
            {items.map((item) => (
              <li key={item.id}>
                <div className="checkout-item-thumb">
                  <EnvelopePlaceholder
                    format={item.config.format}
                    colorId={item.config.color}
                    ratio="photo"
                    size="sm"
                    hideCaption
                    hasPrint={item.config.print}
                  />
                </div>
                <div style={{ minWidth: 0 }}>
                  <span className="small" style={{ fontWeight: 600 }}>
                    {item.name}
                  </span>
                  <span className="mono-sm muted" style={{ display: 'block' }}>
                    {item.price.quantity} szt. × {formatPrice(item.price.unitTotal)}
                  </span>
                </div>
                <span className="mono-sm">{formatPrice(item.price.gross)}</span>
              </li>
            ))}
          </ul>

          <div className="summary-divider" />

          <div className="summary-row">
            <span>Produkty</span>
            <span>{formatPrice(itemsGross)}</span>
          </div>
          <div className="summary-row">
            <span>Dostawa</span>
            <span>{formatPrice(DELIVERY_COST)}</span>
          </div>
          <div className="summary-row muted">
            <span>Netto</span>
            <span>{formatPrice(net)}</span>
          </div>
          <div className="summary-row muted">
            <span>VAT 23%</span>
            <span>{formatPrice(round2(gross - net))}</span>
          </div>

          <div className="summary-total">
            <span className="label">Razem brutto</span>
            <span className="price">{formatPrice(gross)}</span>
          </div>

          <ul className="checkout-trust">
            <li>Płatność szyfrowana — Przelewy24</li>
            <li>Faktura VAT do każdego zamówienia</li>
            <li>Kontrola jakości przed wysyłką</li>
          </ul>
        </aside>
      </div>

      {/* Mobile: przyklejony pasek z kwotą i skrótem do przycisku */}
      <div className="mobile-summary">
        <div className="mobile-summary-row">
          <span>
            <span className="price">{formatPrice(gross)}</span>
            <span className="small muted" style={{ display: 'block' }}>
              z dostawą
            </span>
          </span>
          <button type="button" className="btn" onClick={() => void submitOrder()} disabled={submitting}>
            {submitting ? 'Przetwarzanie…' : 'Zamawiam i płacę'}
          </button>
        </div>
      </div>
    </>
  );
}

/** Kod pocztowy formatujemy w locie do postaci 00-000. */
function formatPostalCode(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 5);
  return digits.length > 2 ? `${digits.slice(0, 2)}-${digits.slice(2)}` : digits;
}

interface FieldRefs {
  current: Partial<Record<string, HTMLElement | null>>;
}

function Field({
  name,
  label,
  value,
  onChange,
  error,
  fieldProps,
  refs,
  type = 'text',
  autoComplete,
  placeholder,
  inputMode,
  hint,
  style,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  fieldProps: Record<string, unknown>;
  refs: FieldRefs;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  inputMode?: 'numeric' | 'text' | 'tel' | 'email';
  hint?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className="field" style={style}>
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        ref={(node) => {
          refs.current[name] = node;
        }}
        className="input"
        type={type}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        {...fieldProps}
      />
      {error ? (
        <p className="field-error" id={`${name}-error`} role="alert">
          {error}
        </p>
      ) : hint ? (
        <span className="field-hint">{hint}</span>
      ) : null}
    </div>
  );
}

function TruckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 16V6h11v10M14 9h4l3 3.5V16h-7" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </svg>
  );
}

