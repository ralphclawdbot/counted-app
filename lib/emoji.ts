/**
 * Convert emoji character to Twemoji CDN code point.
 */
export function getIconCode(char: string): string {
  const codePoint = char.codePointAt(0);
  if (!codePoint) return '';
  return codePoint.toString(16);
}

/**
 * Load emoji as SVG from Twemoji CDN.
 */
export async function loadEmoji(emoji: string): Promise<string> {
  const code = getIconCode(emoji);
  const url = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${code}.svg`;
  const res = await fetch(url);
  if (!res.ok) return '';
  return await res.text();
}

/**
 * Satori loadAdditionalAsset callback for emoji rendering.
 */
export async function loadAdditionalAsset(
  _code: string,
  segment: string
): Promise<string | undefined> {
  if (segment.length <= 3) return undefined;
  // Try loading as emoji
  const svg = await loadEmoji(segment);
  if (svg) return `data:image/svg+xml;base64,${btoa(svg)}`;
  return undefined;
}
