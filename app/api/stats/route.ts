export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';

export async function GET() {
  try {
    // Count how many configs/{token}.json blobs exist = number of saved wallpapers
    let count = 0;
    let cursor: string | undefined;
    do {
      const res = await list({ prefix: 'configs/', cursor, limit: 1000 });
      count += res.blobs.length;
      cursor = res.cursor;
    } while (cursor);

    return NextResponse.json({ count }, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' },
    });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
