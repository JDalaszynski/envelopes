import { plural } from './pricing';
import type { EnvelopeConfig, UploadedFile } from './types';

/**
 * Nadruk ma dwa miejsca: przód koperty i zamknięcie (klapkę z tyłu). Każde
 * zamawia się osobno i każde ma własne pliki oraz uwagi, więc koszyk, panel
 * klienta, panel Admina i e-mail do obsługi opisują je tym samym zestawem
 * pól. Ten moduł jest jedynym miejscem, które wie, jak z konfiguracji
 * odczytać, **co** drukujemy na każdej stronie.
 */

export type PrintSide = 'przod' | 'zamkniecie';

export const PRINT_SIDE_LABEL: Record<PrintSide, string> = {
  przod: 'Nadruk na przodzie',
  zamkniecie: 'Nadruk na zamknięciu',
};

export interface PrintSideSpec {
  side: PrintSide;
  label: string;
  files: UploadedFile[];
  notes: string;
  /** Jednozdaniowy opis plików do listy w koszyku */
  summary: string;
}

function filesSummary(files: UploadedFile[]): string {
  if (files.length === 0) return 'brak pliku';
  const count = `${files.length} ${plural(files.length, 'plik', 'pliki', 'plików')}`;
  return `${count} (${files.map((file) => file.name).join(', ')})`;
}

export function printSides(config: EnvelopeConfig): PrintSideSpec[] {
  const sides: PrintSideSpec[] = [];

  if (config.print) {
    sides.push({
      side: 'przod',
      label: PRINT_SIDE_LABEL.przod,
      files: config.printFiles,
      notes: config.printNotes?.trim() ?? '',
      summary: filesSummary(config.printFiles),
    });
  }

  if (config.backPrint) {
    const files = config.backPrintFiles ?? [];
    sides.push({
      side: 'zamkniecie',
      label: PRINT_SIDE_LABEL.zamkniecie,
      files,
      notes: config.backPrintNotes?.trim() ?? '',
      summary: filesSummary(files),
    });
  }

  return sides;
}
