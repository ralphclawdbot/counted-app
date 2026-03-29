import { WallpaperConfig } from '@/types';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || '';

export function buildWallpaperUrl(config: WallpaperConfig): string {
  const params = new URLSearchParams();
  params.set('type', config.type);
  params.set('width', String(config.width));
  params.set('height', String(config.height));

  if (config.birthday) params.set('birthday', config.birthday);
  if (config.lifespan) params.set('lifespan', String(config.lifespan));
  if (config.deadline) params.set('deadline', config.deadline);
  if (config.goalStart) params.set('goalStart', config.goalStart);

  params.set('bg', config.bg);
  params.set('dotFilled', config.dotFilled);
  params.set('dotEmpty', config.dotEmpty);
  params.set('dotCurrent', config.dotCurrent);
  params.set('dotFilledOpacity', String(config.dotFilledOpacity));
  params.set('dotEmptyOpacity', String(config.dotEmptyOpacity));
  params.set('dotShape', config.dotShape);
  params.set('dotStyle', config.dotStyle);
  params.set('dotMode', config.dotMode);

  if (config.emojiLived) params.set('emojiLived', config.emojiLived);
  if (config.emojiEmpty) params.set('emojiEmpty', config.emojiEmpty);
  if (config.dotSymbol) params.set('dotSymbol', config.dotSymbol);
  if (config.bgBlur) params.set('bgBlur', String(config.bgBlur));
  if (config.bgDim) params.set('bgDim', String(config.bgDim));
  if (config.gradientMode) {
    params.set('gradientMode', 'true');
    if (config.gradientStart) params.set('gradientStart', config.gradientStart);
    if (config.gradientEnd) params.set('gradientEnd', config.gradientEnd);
  }
  if (config.showQuote) params.set('showQuote', 'true');

  if (config.lifeEvents && config.lifeEvents.length > 0) {
    params.set(
      'lifeEvents',
      config.lifeEvents.map((e) => `${e.date}:${e.icon}`).join(',')
    );
  }

  // Photo layers via URL params (up to 5 cutouts + 1 bg)
  if (config.layers) {
    const bg = config.layers.find((l) => l.type === 'bg');
    if (bg) {
      params.set('bgImage', bg.url);
      params.set('bgOffsetX', String((bg as import('@/types').BgLayer).panX));
      params.set('bgOffsetY', String((bg as import('@/types').BgLayer).panY));
    }
    const cutouts = config.layers.filter((l) => l.type === 'cutout').sort((a, b) => a.zIndex - b.zIndex);
    cutouts.slice(0, 5).forEach((c, i) => {
      const n = i + 1;
      const cut = c as import('@/types').CutoutLayer;
      params.set(`cutout${n}Url`, cut.url);
      params.set(`cutout${n}X`, String(cut.x));
      params.set(`cutout${n}Y`, String(cut.y));
      params.set(`cutout${n}Scale`, String(cut.layerSize));
      params.set(`cutout${n}Opacity`, String(cut.opacity));
      params.set(`cutout${n}W`, String(cut.naturalW));
      params.set(`cutout${n}H`, String(cut.naturalH));
    });
  }

  return `${APP_URL}/api/wallpaper?${params.toString()}`;
}

export function buildTokenUrl(token: string): string {
  return `${APP_URL}/api/w/${token}`;
}
