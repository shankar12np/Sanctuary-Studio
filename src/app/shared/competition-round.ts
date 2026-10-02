/**
 * Groups writing-competition entries into 6-month rounds (Jan–Jun /
 * Jul–Dec of a given year), derived from each entry's submission date.
 * No schema change needed — every entry already has createdAt, so the
 * round is computed on read rather than stored.
 */

export function roundKey(date: Date): string {
  const year = date.getFullYear();
  const half = date.getMonth() < 6 ? 'H1' : 'H2';
  return `${year}-${half}`;
}

export function roundLabel(key: string): string {
  const [year, half] = key.split('-');
  return half === 'H1' ? `Jan–Jun ${year}` : `Jul–Dec ${year}`;
}

/** Sorts round keys newest-first, e.g. ["2026-H2", "2026-H1", "2025-H2"]. */
export function compareRoundsDesc(a: string, b: string): number {
  return b.localeCompare(a);
}
