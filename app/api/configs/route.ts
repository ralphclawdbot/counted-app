import { NextRequest, NextResponse } from 'next/server';
import { put, list, head } from '@vercel/blob';
import { nanoid } from 'nanoid';
import { WallpaperConfig } from '@/types';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || '';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 });

  try {
    const blobMeta = await head(`configs/${token}.json`);
    const res = await fetch(blobMeta.url);
    if (!res.ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const config = await res.json() as WallpaperConfig;
    return NextResponse.json({ config });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json() as { config: WallpaperConfig };
  const { config } = body;

  if (!config || !config.type) {
    return NextResponse.json({ error: 'Invalid config' }, { status: 400 });
  }

  const token = nanoid(8);
  await put(`configs/${token}.json`, JSON.stringify(config), {
    contentType: 'application/json',
    access: 'public',
    addRandomSuffix: false,
  });

  return NextResponse.json({
    token,
    url: `${APP_URL}/api/w/${token}`,
  });
}

export async function PUT(request: NextRequest) {
  const body = await request.json() as { token: string; config: WallpaperConfig };
  const { token, config } = body;

  if (!token || !config) {
    return NextResponse.json({ error: 'Token and config required' }, { status: 400 });
  }

  // Check if token exists
  const { blobs } = await list({ prefix: `configs/${token}.json`, limit: 1 });
  if (blobs.length === 0) {
    return NextResponse.json({ error: 'Token not found' }, { status: 404 });
  }

  await put(`configs/${token}.json`, JSON.stringify(config), {
    contentType: 'application/json',
    access: 'public',
    addRandomSuffix: false,
  });

  return NextResponse.json({
    token,
    url: `${APP_URL}/api/w/${token}`,
  });
}
