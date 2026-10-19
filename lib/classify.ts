import type { EventMeta } from './events'

// ── Pañales ──────────────────────────────────────────────────────────────────
// Históricamente se han guardado con dos formularios distintos:
//   { condition: "wet" | "dirty" | "both" … }  y  { condition: "pee" | "poo" …, ui_condition: "Mojado" | "Sucio" … }
// Se miran ambos campos y ambos vocabularios. `notes` se ignora a propósito
// (texto libre que podría contener cualquier palabra).

export type DiaperType = 'pee' | 'poo' | 'mixed' | 'clean'

export const DIAPER_LABELS: Record<DiaperType, string> = {
  pee: 'Mojado',
  poo: 'Sucio',
  mixed: 'Mixto',
  clean: 'Limpio',
}

export function classifyDiaper(meta: EventMeta): DiaperType {
  const text = [meta.condition, meta.ui_condition, meta.status, meta.type]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  const mixed = /both|mixed|mixto|ambos/.test(text)
  const pee = /wet|pee|pip[ií]|mojado/.test(text)
  const poo = /dirty|poo|\bbm\b|sucio|caca/.test(text)

  if (mixed || (pee && poo)) return 'mixed'
  if (poo) return 'poo'
  if (pee) return 'pee'
  return 'clean'
}

export const hasPee = (t: DiaperType) => t === 'pee' || t === 'mixed'
export const hasPoo = (t: DiaperType) => t === 'poo' || t === 'mixed'

// ── Tomas ────────────────────────────────────────────────────────────────────

export type FeedType = 'bottle' | 'nursing' | 'solids' | 'unknown'

export const FEED_LABELS: Record<FeedType, string> = {
  bottle: 'Biberón',
  nursing: 'Pecho',
  solids: 'Sólidos',
  unknown: 'Toma',
}

export function feedType(meta: EventMeta): FeedType {
  const t = meta.type
  return t === 'bottle' || t === 'nursing' || t === 'solids' ? t : 'unknown'
}

/** Admite números o strings tipo "120", "120ml", "120,5". */
export function feedAmountMl(meta: EventMeta): number {
  const raw = meta.amount_ml ?? meta.amount
  if (raw === undefined || raw === null) return 0
  const n = parseFloat(String(raw).replace(',', '.').replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) ? n : 0
}

/** Lado de la toma de pecho: L, R o U (indefinido). */
export function nursingSide(meta: EventMeta): 'L' | 'R' | 'U' {
  return meta.condition === 'L' || meta.condition === 'R' ? meta.condition : 'U'
}
