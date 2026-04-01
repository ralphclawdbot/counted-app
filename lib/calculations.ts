/**
 * How many minutes to look ahead when computing "now".
 * Wallpaper automations fire at midnight — we advance 3 minutes so the
 * calendar image already reflects the new day starting at 11:57 PM,
 * guaranteeing the correct date is shown when the automation triggers.
 */
const LOOKAHEAD_MINUTES = 3;

/**
 * Get "now" as a plain Date whose year/month/day/hour reflects the given IANA timezone.
 * Advances time by LOOKAHEAD_MINUTES so near-midnight requests already show the next day.
 */
export function nowInTz(tz?: string): Date {
  // Advance wall-clock time by the lookahead offset
  const lookahead = new Date(Date.now() + LOOKAHEAD_MINUTES * 60 * 1000);

  if (!tz) return lookahead;
  try {
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: tz,
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
      hour12: false,
    }).formatToParts(lookahead);
    const get = (t: string) => parseInt(parts.find(p => p.type === t)?.value ?? '0', 10);
    // hour12:false can return 24 for midnight — normalise to 0
    const h = get('hour') === 24 ? 0 : get('hour');
    return new Date(get('year'), get('month') - 1, get('day'), h, get('minute'), get('second'));
  } catch {
    return lookahead; // invalid tz — fallback to offset time
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
export function daysInYear(year: number): number {
  return (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 366 : 365;
}

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
