'use client';

/**
 * Pasek kroków konfiguratora — nagłówek narzędzia nad pierwszą kartą.
 *
 * Ciemny pas mówi „narzędzie jest tutaj", pasek kroków dopowiada, ile
 * decyzji zostało. Zadanie z widocznym końcem przewija się inaczej niż
 * treść bez końca — użytkownik wie, po co przewija i kiedy przestać.
 *
 * Kroki są klikalne — powrót do wcześniejszej decyzji nie wymaga szukania
 * jej wzrokiem w kolumnie kart. Kroki jeszcze niedostępne są wyłączone,
 * bo sekcja koloru istnieje dopiero po wyborze formatu.
 */

const STEPS: { label: string; full: string }[] = [
  { label: 'Format', full: 'Wybór formatu koperty' },
  { label: 'Kolor', full: 'Wybór koloru' },
  { label: 'Nadruk', full: 'Nadruk i personalizacja' },
];

export type StepNumber = 1 | 2 | 3;

export function ConfigProgress({
  current,
  onGoToStep,
}: {
  /** Pierwszy krok, którego użytkownik jeszcze nie wykonał. */
  current: StepNumber;
  onGoToStep: (step: StepNumber) => void;
}) {
  return (
    <nav className="config-progress" aria-label="Kroki konfiguratora">
      <ol className="config-progress-rail">
        {STEPS.map((step, index) => {
          const number = (index + 1) as StepNumber;
          const state = number < current ? 'done' : number === current ? 'current' : 'todo';
          const reachable = number <= current;

          return (
            <li className="config-progress-step" data-state={state} key={step.label}>
              <button
                type="button"
                className="config-progress-btn"
                onClick={() => onGoToStep(number)}
                disabled={!reachable}
                aria-current={state === 'current' ? 'step' : undefined}
                aria-label={`Krok ${number} z 3: ${step.full}${
                  state === 'done' ? ' — wykonany' : ''
                }`}
              >
                <span className="config-progress-dot" aria-hidden="true">
                  {state === 'done' ? (
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path
                        d="m4 10.5 4 4 8-9"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    number
                  )}
                </span>
                <span className="config-progress-label">{step.label}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <p className="config-progress-meta mono-sm" aria-hidden="true">
        Krok {current} z 3
      </p>
    </nav>
  );
}
