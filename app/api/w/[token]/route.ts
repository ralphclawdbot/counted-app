export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { list } from '@vercel/blob';
import { WallpaperConfig } from '@/types';
import { renderWallpaper } from '@/lib/renderWallpaper';
import fs from 'fs';
import path from 'path';

// Load font at module level
const fontPath = path.join(process.cwd(), 'public', 'fonts', 'inter.ttf');
const fontData: ArrayBuffer = fs.readFileSync(fontPath).buffer as ArrayBuffer;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Look up config blob by token
    const { blobs } = await list({ prefix: `configs/${token}.json`, limit: 1 });
    if (blobs.length === 0) {
      return new NextResponse('Not found', { status: 404 });
    }

    const blobRes = await fetch(blobs[0].url);
    if (!blobRes.ok) {
      return new NextResponse('Config unavailable', { status: 502 });
    }

    const raw = await blobRes.json() as WallpaperConfig;
    // Normalize colors — strip any accidental '#' prefix so renderWallpaper doesn't double-hash
    const stripHash = (s?: string) => (s || '').replace(/^#/, '');
    const config: WallpaperConfig = {
      ...raw,
      bg: stripHash(raw.bg),
      dotFilled: stripHash(raw.dotFilled),
      dotEmpty: stripHash(raw.dotEmpty),
      dotCurrent: stripHash(raw.dotCurrent),
      ...(raw.gradientStart && { gradientStart: stripHash(raw.gradientStart) }),
      ...(raw.gradientEnd   && { gradientEnd:   stripHash(raw.gradientEnd) }),
    };

    const imageResponse = await renderWallpaper(config, fontData);

    // Convert ImageResponse to a plain Response with proper headers
    const imageBuffer = await imageResponse.arrayBuffer();
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Token wallpaper error:', err);
    return new NextResponse(`Error: ${message}`, { status: 500 });
  }
}
