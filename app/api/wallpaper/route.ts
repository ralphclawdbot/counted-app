export const runtime = 'edge';

import { NextRequest } from 'next/server';
import { parseConfigFromParams } from '@/lib/buildConfig';
import { renderWallpaper } from '@/lib/renderWallpaper';

// Load all fonts at module level for edge caching
const fontPromise = fetch(new URL('../../../public/fonts/inter.ttf', import.meta.url)).then((r) => r.arrayBuffer());
const extraFontPromises: { name: string; promise: Promise<ArrayBuffer> }[] = [
  { name: 'Space Grotesk', promise: fetch(new URL('../../../public/fonts/space-grotesk.woff', import.meta.url)).then((r) => r.arrayBuffer()) },
  { name: 'Playfair Display', promise: fetch(new URL('../../../public/fonts/playfair-display.woff', import.meta.url)).then((r) => r.arrayBuffer()) },
  { name: 'DM Mono', promise: fetch(new URL('../../../public/fonts/dm-mono.woff', import.meta.url)).then((r) => r.arrayBuffer()) },
  { name: 'Bebas Neue', promise: fetch(new URL('../../../public/fonts/bebas-neue.woff', import.meta.url)).then((r) => r.arrayBuffer()) },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const config = parseConfigFromParams(searchParams);

    // Validate goal duration
    if (config.type === 'goal' && config.goalStart && config.deadline) {
      const start = new Date(config.goalStart);
      const end = new Date(config.deadline);
      const diffDays = (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);
      if (diffDays > 1825) {
        return new Response('Goal deadline must be within 5 years of start date.', { status: 400 });
      }
    }

    const [fontData, ...extraFontData] = await Promise.all([
      fontPromise,
      ...extraFontPromises.map((f) => f.promise),
    ]);
    const extraFonts = extraFontPromises.map((f, i) => ({ name: f.name, data: extraFontData[i] }));
    const imageResponse = await renderWallpaper(config, fontData, extraFonts);
    return imageResponse;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Wallpaper error:', err);
    return new Response(`Error: ${message}`, { status: 500 });
  }
}
