'use client';

/**
 * Wskaźnik kroków konfiguratora — sygnatura projektu (pkt 4.0).
 * Ukończony krok „pieczętuje się" odciskiem laku, krok aktywny to pusty
 * okrąg w kolorze atramentu z wyróżnioną etykietą. Klikalne są wyłącznie
 * kroki już odwiedzone.
 *
 * Layout: siatka o równych kolumnach; linia łącząca rysowana jest jako
 * pseudoelement każdego kroku (poza pierwszym) na wysokości środka kropki,
 * dzięki czemu nie rozjeżdża się przy dowolnej liczbie kroków ani przy
 * etykietach o różnej długości.
 */

interface Props {
  steps: string[];
  current: number;
  completed: number;
  onGoTo: (index: number) => void;
}

export function SealStepper({ steps, current, completed, onGoTo }: Props) {
  return (
    <ol className="steps" aria-label="Postęp konfiguracji">
      {steps.map((label, index) => {
        const state = index < completed ? 'done' : index === current ? 'current' : 'todo';
        const clickable = index <= completed && index !== current;

        return (
          <li className="step" data-state={state} key={label}>
            <button
              type="button"
              className="step-btn"
              data-clickable={clickable}
              aria-current={index === current ? 'step' : undefined}
              aria-label={`Krok ${index + 1} z ${steps.length}: ${label}${
                state === 'done' ? ' — ukończony' : state === 'current' ? ' — bieżący' : ''
              }`}
              disabled={!clickable}
              onClick={() => clickable && onGoTo(index)}
            >
              <span className="step-dot" aria-hidden="true">
                {state === 'done' ? '' : index + 1}
              </span>
              <span className="step-label">{label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
