/**
 * Calculate weeks lived since birthday.
 */
export function weeksLived(birthday: string): number {
  const birth = new Date(birthday + 'T00:00:00');
  const now = new Date();
  const diffMs = now.getTime() - birth.getTime();
  return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
}

/**
 * Day of year (0-indexed: Jan 1 = 0, Jan 2 = 1, ...).
 * Used as filledDots (days already completed) and currentDot index.
 * On Jan 1: returns 0 → 0 dots filled, dot 0 is the current ring.
 */
export function dayOfYear(date?: Date): number {
  const d = date || new Date();
  const start = new Date(d.getFullYear(), 0, 1); // Jan 1st of current year
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}

/**
 * Goal progress: how many days elapsed from goalStart to now.
 */
export function goalProgress(goalStart: string, deadline: string): { elapsed: number; total: number } {
  const start = new Date(goalStart + 'T00:00:00');
  const end = new Date(deadline + 'T00:00:00');
  const now = new Date();
  const total = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  const elapsed = Math.max(0, Math.min(total, Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))));
  return { elapsed, total };
}
