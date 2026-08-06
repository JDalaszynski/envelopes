/**
 * Ścieżki, na których serwis zdejmuje pełną oprawę (menu, pasek zaufania,
 * rozbudowana stopka) i zostawia sam proces zakupowy.
 *
 * Powód jest konwersyjny: w checkoucie każdy odnośnik prowadzący poza
 * formularz to potencjalne porzucenie koszyka. Zostaje logo — jako kotwica
 * zaufania i jedyne wyjście awaryjne.
 */
export function isCheckoutRoute(pathname: string): boolean {
  return pathname === '/zamowienie' || pathname.startsWith('/zamowienie/');
}
