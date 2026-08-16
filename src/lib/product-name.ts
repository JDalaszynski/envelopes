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
 * Opisowy alt zdjęcia produktowego — realnie wspiera SEO obrazów (pkt 8.3).
 *
 * Opis mówi, co na kadrze faktycznie widać: dwie koperty na białym tle,
 * jedna odwrócona klapką do przodu, druga tyłem. Sam zestaw „format + kolor"
 * był poprawny, ale nie odróżniał tego zdjęcia od żadnego innego zdjęcia
 * koperty w tym samym kolorze — a alt ma opisywać kadr, nie pozycję katalogu.
 *
 * Gramatura wchodzi do opisu, bo jest jedyną cechą papieru czytelną w opisie
 * tekstowym i realnie odróżnia odcienie o tej samej nazwie potocznej.
 *
 * Wariant dopisuje usługę widoczną na zdjęciu, bo zdjęcie koperty z nadrukiem
 * i zdjęcie koperty gładkiej to dwa różne obrazy i nie mogą mieć tego samego opisu.
 */
export function buildImageAlt(
  format: string,
  colorId: string,
  variant?: 'nadruk' | 'personalizacja'
): string {
  const color = COLOR_MAP[colorId];
  const name = color?.name ?? colorId;

  /* Nazwa koloru stoi po dwukropku, w formie mianownikowej z katalogu.
     Odmiana („w kolorze granatowym") wymagałaby osobnej mapy przypadków:
     `COLORS[].name` miesza rodzaje — Czarny, Szara, Matcha, Butelkowa Zieleń,
     Ecru — więc żadna pojedyncza końcówka nie jest poprawna dla wszystkich,
     a mapa rozjeżdżałaby się przy każdym nowym odcieniu. Forma cytowana jest
     poprawna niezależnie od rodzaju i zgodna z podpisami na stronie. */
  const spec = [
    `Kolor: ${name}`,
    color?.weight && `papier ${color.weight.replace('g', ' g/m²')}`,
    color?.finish && `wykończenie ${color.finish}`,
  ]
    .filter(Boolean)
    .join(', ');

  /* Kadr z `prints/` **nie pokazuje logo** — na przedniej ściance stoi symbol
     grafiki oznaczający pole nadruku. Poprzedni opis („z nadrukiem logo
     firmowego") obiecywał coś, czego na obrazku nie ma; użytkownik Grafiki
     Google zobaczyłby po kliknięciu co innego niż w opisie. Kadr
     z `personalized/` niesie realny blok adresowy, ale dane są przykładowe
     i opis musi to mówić wprost. */
  const scene =
    variant === 'nadruk'
      ? `Dwie koperty ozdobne ${format} na białym tle, na przedniej zaznaczone pole nadruku logo`
      : variant === 'personalizacja'
        ? `Dwie koperty ozdobne ${format} na białym tle, na przedniej nadrukowany przykładowy adres odbiorcy`
        : `Dwie koperty ozdobne ${format} na białym tle, widok klapki i tylnej ścianki`;

  return `${scene}. ${spec}.`;
}
