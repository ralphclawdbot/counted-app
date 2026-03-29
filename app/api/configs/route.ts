import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { nanoid } from 'nanoid';
import { WallpaperConfig } from '@/types';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || '';
const TTL = 31536000; // 1 year in seconds

export async function POST(request: NextRequest) {
  const body = await request.json() as { config: WallpaperConfig };
  const { config } = body;

  if (!config || !config.type) {
    return NextResponse.json({ error: 'Invalid config' }, { status: 400 });
  }

  const token = nanoid(8);
  await kv.set(`config:${token}`, JSON.stringify(config), { ex: TTL });

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

  const existing = await kv.get(`config:${token}`);
  if (!existing) {
    return NextResponse.json({ error: 'Token not found' }, { status: 404 });
  }

  await kv.set(`config:${token}`, JSON.stringify(config), { ex: TTL });

  return NextResponse.json({
    token,
    url: `${APP_URL}/api/w/${token}`,
  });
}
