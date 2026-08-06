/**
 * Mikrocopy zapowiadające krok akceptacji wizualizacji (pkt 1.11).
 * Pokazywane jeszcze przed złożeniem zamówienia — po to, żeby dodatkowy
 * krok po zapłacie nie był zaskoczeniem.
 */
export function VisualizationNotice() {
  return (
    <p className="notice notice-seal">
      Po złożeniu zamówienia nasz grafik przygotuje wizualizację do Państwa akceptacji — prześlemy
      ją e-mailem. Produkcja ruszy dopiero po zatwierdzeniu projektu.
    </p>
  );
}
