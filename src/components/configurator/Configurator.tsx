'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ConfigProgress } from '@/components/configurator/ConfigProgress';
import type { StepNumber } from '@/components/configurator/ConfigProgress';
import { SummaryBar } from '@/components/configurator/SummaryBar';

import { StepFormat } from '@/components/configurator/steps/StepFormat';
import { StepColor } from '@/components/configurator/steps/StepColor';
import { StepPrint } from '@/components/configurator/steps/StepPrint';
import { StepPersonalization } from '@/components/configurator/steps/StepPersonalization';
import { useCart, EDIT_KEY } from '@/components/providers/CartProvider';

import { calculatePrice, minimumQuantity } from '@/lib/pricing';
import {
  COLOR_MAP,
  DEFAULT_PERSONALIZATION_SCOPE,
  FORMAT_MAP,
  PERSONALIZATION_SCOPES,
} from '@/lib/catalog';
import type { FormatId, PersonalizationScope } from '@/lib/catalog';
import type { EnvelopeConfig } from '@/lib/types';

const DEFAULT_CONFIG: EnvelopeConfig = {
  format: 'DL' as FormatId,
  color: '',
  quantity: 100,
  print: false,
  printFiles: [],
  printNotes: '',
  personalization: false,
  personalizationScope: DEFAULT_PERSONALIZATION_SCOPE,
  personalizationMethod: undefined,
  personalizationText: '',
  personalizationFile: null,
  shippingSpeed: 'standard',
};

interface Problem {
  ref: React.RefObject<HTMLDivElement | null>;
  message: string;
}

/** Preselekcja konfiguratora — ze zdarzenia `envelopes:configure` albo z adresu. */
interface Preselect {
  format?: FormatId;
  color?: string;
  step?: number;
  print?: boolean;
  personalization?: boolean;
  personalizationScope?: PersonalizationScope;
}

export function Configurator() {
  const router = useRouter();
  const { addItem, updateItem } = useCart();

  const [config, setConfig] = useState<EnvelopeConfig>(DEFAULT_CONFIG);
  const [toast, setToast] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [showProblem, setShowProblem] = useState(false);
  
  const formatRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [showScrollBack, setShowScrollBack] = useState(false);

  const patch = useCallback((changes: Partial<EnvelopeConfig>) => {
    setConfig((prev) => ({ ...prev, ...changes }));
  }, []);

  const scrollToRef = useCallback((ref: React.RefObject<HTMLDivElement | null>) => {
    setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }, []);

  const applyPreselect = useCallback(
    (detail: Preselect) => {
      const format =
        detail.format && !FORMAT_MAP[detail.format]?.disabled ? detail.format : undefined;
      const color = detail.color && COLOR_MAP[detail.color] ? detail.color : undefined;
      const scope = PERSONALIZATION_SCOPES.some((option) => option.id === detail.personalizationScope)
        ? detail.personalizationScope
        : undefined;

      if (!format && !color && !detail.print && !detail.personalization) return;

      setConfig((prev) => ({
        ...prev,
        ...(format ? { format } : {}),
        ...(color ? { color } : {}),
        ...(detail.print ? { print: true } : {}),
        ...(detail.personalization ? { personalization: true } : {}),
        ...(detail.personalization && scope ? { personalizationScope: scope } : {}),
      }));

      /* Sekcja nadruku pojawia się dopiero po wyborze koloru — bez koloru
         przewijamy do kroku, który użytkownik ma faktycznie do wykonania. */
      if (color) {
        scrollToRef(printRef);
      } else {
        scrollToRef(colorRef);
      }
    },
    [scrollToRef]
  );

  useEffect(() => {
    function handlePreselect(event: Event) {
      const detail = (event as CustomEvent<Preselect>).detail;
      if (!detail) return;
      applyPreselect(detail);
    }
    window.addEventListener('envelopes:configure', handlePreselect);

    try {
      const raw = window.sessionStorage.getItem(EDIT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { itemId?: string; config: EnvelopeConfig };
        setConfig({ ...DEFAULT_CONFIG, ...parsed.config });
        setEditingItemId(parsed.itemId ?? null);
        window.sessionStorage.removeItem(EDIT_KEY);
        setToast('Wczytano konfigurację do edycji.');
        return () => window.removeEventListener('envelopes:configure', handlePreselect);
      }
    } catch {
      /* brak zapisanej konfiguracji */
    }

    /* Wejście z podstrony ofertowej: `/?format=DL&kolor=czarny&nadruk=1#konfigurator`.
       Preselekcja z adresu jest jedynym sposobem na zachowanie intencji przy
       przejściu między trasami — zdarzenie działa tylko w obrębie jednej strony. */
    const params = new URLSearchParams(window.location.search);
    applyPreselect({
      format: (params.get('format') as FormatId | null) ?? undefined,
      color: params.get('kolor') ?? undefined,
      print: params.get('nadruk') === '1',
      personalization: params.get('personalizacja') === '1',
      personalizationScope: (params.get('zakres') as PersonalizationScope | null) ?? undefined,
    });

    return () => window.removeEventListener('envelopes:configure', handlePreselect);
  }, [applyPreselect]);

  const price = useMemo(() => calculatePrice(config), [config]);
  const minimum = minimumQuantity(config.print || config.personalization);

  const problem = useMemo<Problem | null>(() => {
    if (!config.quantity || config.quantity < 1) {
      return { ref: colorRef, message: 'Prosimy podać liczbę kopert.' };
    }
    if (config.quantity < minimum) {
      return {
        ref: printRef,
        message: `Minimalna ilość dla koperty z nadrukiem lub personalizacją to ${minimum} szt. Prosimy zwiększyć ilość albo wyłączyć te opcje.`,
      };
    }
    if (config.print && config.printFiles.filter((f) => f.status === 'przeslano').length === 0) {
      return {
        ref: printRef,
        message: 'Do nadruku potrzebujemy pliku z grafiką. Prosimy dodać go w sekcji Nadruk.',
      };
    }
    if (config.personalization && !config.personalizationMethod) {
      return {
        ref: printRef,
        message: 'Prosimy wybrać, w jaki sposób przekażą Państwo treść personalizacji.',
      };
    }
    if (
      config.personalization &&
      config.personalizationMethod === 'reczna' &&
      !(config.personalizationText ?? '').trim()
    ) {
      return {
        ref: printRef,
        message: 'Prosimy wpisać treść, którą mamy nadrukować na kopertach.',
      };
    }
    if (
      config.personalization &&
      config.personalizationMethod === 'szablon' &&
      config.personalizationFile?.status !== 'przeslano'
    ) {
      return {
        ref: printRef,
        message: 'Prosimy wgrać uzupełniony szablon z danymi do personalizacji.',
      };
    }
    return null;
  }, [config, minimum]);

  function handleAdd() {
    if (problem) {
      setShowProblem(true);
      scrollToRef(problem.ref);
      return;
    }
    setShowProblem(false);
    if (editingItemId) {
      updateItem(editingItemId, config);
      setEditingItemId(null);
      setToast('Zaktualizowano pozycję w koszyku.');
    } else {
      addItem(config);
      setToast('Dodano do koszyka.');
    }
    router.push('/koszyk');
  }



  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!problem) setShowProblem(false);
  }, [problem]);

  useEffect(() => {
    function handleScroll() {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.bottom < -100) {
        setShowScrollBack(true);
      } else {
        setShowScrollBack(false);
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const hasFormat = Boolean(config.format);
  const hasColor = Boolean(config.color);

  /* Krok bieżący = pierwszy niewykonany. Format jest wstępnie wybrany (DL),
     więc konfigurator otwiera się na kroku 2 — pasek mówi to wprost, zamiast
     udawać, że użytkownik ma przed sobą trzy decyzje. */
  const currentStep: StepNumber = !hasFormat ? 1 : !hasColor ? 2 : 3;

  const goToStep = useCallback(
    (step: StepNumber) => {
      const target = step === 1 ? formatRef : step === 2 ? colorRef : printRef;
      target.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    []
  );

  return (
    <div ref={containerRef}>
      <ConfigProgress current={currentStep} onGoToStep={goToStep} />

      <div className="config-card" ref={formatRef}>
        <div className="config-body">
          <StepFormat
            value={config.format}
            colorId={config.color}
            onChange={(format) => {
              patch({ format: format || undefined });
              if (!hasFormat) scrollToRef(colorRef);
            }}
            onNextStep={() => scrollToRef(colorRef)}
          />
        </div>
      </div>

      {hasFormat && (
        <div className="config-card" style={{ marginTop: 'var(--space-4)' }} ref={colorRef}>
          <div className="config-body">
            <StepColor
              value={config.color}
              format={config.format}
              onChange={(color) => {
                patch({ color });
                if (!hasColor) scrollToRef(printRef);
              }}
            />
          </div>
        </div>
      )}

      {hasFormat && hasColor && (
        <div className="config-card" style={{ marginTop: 'var(--space-4)' }} ref={printRef}>
          <div className="config-body">
            <div className="stack" style={{ gap: 'var(--space-5)' }}>
              <div>
                <span className="eyebrow">Krok 3 z 3 · opcjonalnie</span>
                <h3>Nadruk i personalizacja</h3>
                <p className="muted" style={{ marginTop: 'var(--space-2)' }}>
                  Obie opcje można włączyć razem albo pominąć — koperta bez zadruku jest gotowa do
                  wysyłki od ręki.
                </p>
              </div>

              <StepPrint
                enabled={config.print}
                files={config.printFiles}
                notes={config.printNotes ?? ''}
                quantity={config.quantity}
                minimum={minimumQuantity(true)}
                onToggle={(print) =>
                  patch({ print, ...(print ? {} : { printFiles: [], printNotes: '' }) })
                }
                onFilesChange={(printFiles) => patch({ printFiles })}
                onNotesChange={(printNotes) => patch({ printNotes })}
                onFixQuantity={() => patch({ quantity: minimumQuantity(true) })}
                format={config.format}
                colorId={config.color}
              />

              <hr />

              <StepPersonalization
                enabled={config.personalization}
                scope={config.personalizationScope}
                method={config.personalizationMethod}
                text={config.personalizationText ?? ''}
                file={config.personalizationFile ?? null}
                quantity={config.quantity}
                minimum={minimumQuantity(true)}
                onToggle={(personalization) =>
                  patch({
                    personalization,
                    ...(personalization
                      ? {}
                      : {
                          personalizationScope: DEFAULT_PERSONALIZATION_SCOPE,
                          personalizationMethod: undefined,
                          personalizationText: '',
                          personalizationFile: null,
                        }),
                  })
                }
                /* Zmiana zakresu zmienia kolumny szablonu, więc wgrany wcześniej
                   arkusz przestaje pasować — usuwamy go razem z wyborem. */
                onScopeChange={(personalizationScope) =>
                  patch({ personalizationScope, personalizationFile: null })
                }
                onMethodChange={(personalizationMethod) => patch({ personalizationMethod })}
                onTextChange={(personalizationText) => patch({ personalizationText })}
                onFileChange={(personalizationFile) => patch({ personalizationFile })}
                onFixQuantity={() => patch({ quantity: minimumQuantity(true) })}
                format={config.format}
                colorId={config.color}
              />

            </div>
          </div>
        </div>
      )}

      {hasFormat && hasColor && (
        <SummaryBar
          config={config}
          price={price}
          problem={showProblem && problem ? problem.message : null}
          onAdd={handleAdd}
          onQuantityChange={(quantity) => patch({ quantity })}
          minimumQuantity={minimum}
        />
      )}

      {toast && (
        <div className="toast" role="status">
          <span>{toast}</span>
          <Link href="/koszyk">Przejdź do koszyka</Link>
        </div>
      )}

      {showScrollBack && (
        <button
          type="button"
          className="btn scroll-back-btn"
          onClick={() => {
            containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        >
          Powrót do konfiguratora <span>↑</span>
        </button>
      )}
    </div>
  );
}
