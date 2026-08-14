import { COLOR_MAP } from './catalog';
import type { EnvelopeConfig } from './types';

/**
 * Ustandaryzowana nazwa produktu (pkt 1.9).
 *
 *   Koperta [Format] [Kolor] [z nadrukiem] [z personalizacją]
 *
 * Nazwa opisuje wyłącznie sam produkt. Czas realizacji dotyczy całej
 * przesyłki, a nie pojedynczej pozycji, więc nie wchodzi do nazwy —
 * jest osobną informacją zamówienia.
 *
 * Używana konsekwentnie w konfiguratorze, koszyku, checkoucie, panelu klienta,
 * panelu Admina, na fakturze i w e-mailach transakcyjnych.
 */
export function buildProductName(config: EnvelopeConfig): string {
  const color = COLOR_MAP[config.color]?.name ?? config.color;
  const parts = ['Koperta', config.format, color];
  if (config.print) parts.push('z nadrukiem');
  if (config.personalization) parts.push('z personalizacją');
  return parts.join(' ');
}

/**
 * Opisowy alt placeholdera produktowego — realnie wspiera SEO obrazów (pkt 8.3).
 * Wariant dopisuje usługę widoczną na zdjęciu, bo zdjęcie koperty z nadrukiem
 * i zdjęcie koperty gładkiej to dwa różne obrazy i nie mogą mieć tego samego opisu.
 */
export function buildImageAlt(
  format: string,
  colorId: string,
  variant?: 'nadruk' | 'personalizacja'
): string {
  const color = COLOR_MAP[colorId]?.name ?? colorId;
  const base = `Koperta ozdobna, format ${format}, kolor ${color.toLowerCase()}`;
  if (variant === 'nadruk') return `${base}, z nadrukiem logo firmowego`;
  if (variant === 'personalizacja') return `${base}, z personalizacją — nadrukowanym adresem`;
  return base;
}
