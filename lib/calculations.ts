/**
 * Get "now" as a plain Date whose year/month/day/hour reflects the given IANA timezone.
 * This lets all date calculations treat the user's local date as "today" rather than UTC.
 */
export function nowInTz(tz?: string): Date {
  if (!tz) return new Date();
  try {
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: tz,
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
      hour12: false,
    }).formatToParts(new Date());
    const get = (t: string) => parseInt(parts.find(p => p.type === t)?.value ?? '0', 10);
    // hour12:false can return 24 for midnight — normalise to 0
    const h = get('hour') === 24 ? 0 : get('hour');
    return new Date(get('year'), get('month') - 1, get('day'), h, get('minute'), get('second'));
  } catch {
    return new Date(); // invalid tz — fallback to server time
  }
}

/**
 * Calculate weeks lived since birthday, in the user's timezone.
 */
export function weeksLived(birthday: string, tz?: string): number {
  const birth = new Date(birthday + 'T00:00:00');
  const now = nowInTz(tz);
  const diffMs = now.getTime() - birth.getTime();
  return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
}

/**
 * Day of year (0-indexed: Jan 1 = 0) in the user's timezone.
 */
export function dayOfYear(tz?: string): number {
  const d = nowInTz(tz);
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}

/**
 * Goal progress in the user's timezone.
 */
export function goalProgress(goalStart: string, deadline: string, tz?: string): { elapsed: number; total: number } {
  const start = new Date(goalStart + 'T00:00:00');
  const end = new Date(deadline + 'T00:00:00');
  const now = nowInTz(tz);
  const total = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  const elapsed = Math.max(0, Math.min(total, Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))));
  return { elapsed, total };
}
