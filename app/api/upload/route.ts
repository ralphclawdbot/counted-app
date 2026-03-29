export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import imageSize from 'image-size';
import { randomUUID } from 'crypto';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Invalid file type. Allowed: JPEG, PNG, WebP' },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: 'File too large. Maximum 10MB.' },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Get image dimensions
  const dimensions = imageSize(buffer);
  if (!dimensions.width || !dimensions.height) {
    return NextResponse.json(
      { error: 'Could not determine image dimensions' },
      { status: 400 }
    );
  }

  // Upload to Vercel Blob
  const ext = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1];
  const filename = `uploads/${randomUUID()}.${ext}`;

  const blob = await put(filename, buffer, {
    access: 'public',
    contentType: file.type,
  });

  return NextResponse.json({
    url: blob.url,
    width: dimensions.width,
    height: dimensions.height,
  });
}
