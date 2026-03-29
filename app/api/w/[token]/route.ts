export const runtime = 'edge';

import { NextRequest } from 'next/server';
import { kv } from '@vercel/kv';
import { WallpaperConfig } from '@/types';
import { renderWallpaper } from '@/lib/renderWallpaper';

// Load font at module level for edge caching
const fontPromise = fetch(
  new URL('../../../../public/fonts/inter.ttf', import.meta.url)
).then((res) => res.arrayBuffer());

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const raw = await kv.get(`config:${token}`);
    if (!raw) {
      return new Response('Not found', { status: 404 });
    }

    const config: WallpaperConfig = typeof raw === 'string' ? JSON.parse(raw) : raw as WallpaperConfig;

    const fontData = await fontPromise;
    const imageResponse = await renderWallpaper(config, fontData);
    return imageResponse;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Token wallpaper error:', err);
    return new Response(`Error: ${message}`, { status: 500 });
  }
}
