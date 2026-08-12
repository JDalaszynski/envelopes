/**
 * Mikrocopy zapowiadające krok akceptacji wizualizacji (pkt 1.11).
 * Pokazywane jeszcze przed złożeniem zamówienia — po to, żeby dodatkowy
 * krok po zapłacie nie był zaskoczeniem.
 */
export function VisualizationNotice() {
  return (
    <div className="notice notice-seal" style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
      <span className="info-icon" style={{ flexShrink: 0, position: 'static', marginTop: 2, background: 'var(--color-paper)' }}>i</span>
      <p style={{ margin: 0 }}>
        Po złożeniu zamówienia nasz grafik przygotuje wizualizację do Państwa akceptacji — prześlemy
        ją e-mailem. Produkcja ruszy dopiero po zatwierdzeniu projektu.
      </p>
    </div>
  );
}
