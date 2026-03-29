import { WallpaperConfig, PhotoLayer, BgLayer, CutoutLayer, LifeEvent } from '@/types';

/**
 * Parse URL search params into a WallpaperConfig object.
 */
export function parseConfigFromParams(params: URLSearchParams): WallpaperConfig {
  const config: WallpaperConfig = {
    type: (params.get('type') as WallpaperConfig['type']) || 'life',
    width: parseInt(params.get('width') || '1179', 10),
    height: parseInt(params.get('height') || '2556', 10),
    bg: params.get('bg') || '000000',
    dotFilled: params.get('dotFilled') || 'FFFFFF',
    dotEmpty: params.get('dotEmpty') || 'FFFFFF',
    dotCurrent: params.get('dotCurrent') || 'FFFFFF',
    dotFilledOpacity: parseInt(params.get('dotFilledOpacity') || '85', 10),
    dotEmptyOpacity: parseInt(params.get('dotEmptyOpacity') || '10', 10),
    dotShape: (params.get('dotShape') as WallpaperConfig['dotShape']) || 'square',
    dotStyle: (params.get('dotStyle') as WallpaperConfig['dotStyle']) || 'flat',
    dotMode: (params.get('dotMode') as WallpaperConfig['dotMode']) || 'standard',
  };

  if (params.get('birthday')) config.birthday = params.get('birthday')!;
  if (params.get('lifespan')) config.lifespan = parseInt(params.get('lifespan')!, 10);
  if (params.get('deadline')) config.deadline = params.get('deadline')!;
  if (params.get('goalStart')) config.goalStart = params.get('goalStart')!;
  if (params.get('emojiLived')) config.emojiLived = params.get('emojiLived')!;
  if (params.get('emojiEmpty')) config.emojiEmpty = params.get('emojiEmpty')!;
  if (params.get('dotSymbol')) config.dotSymbol = params.get('dotSymbol')!;
  if (params.get('bgBlur')) config.bgBlur = parseInt(params.get('bgBlur')!, 10);
  if (params.get('bgDim')) config.bgDim = parseInt(params.get('bgDim')!, 10);
  if (params.get('gradientMode') === 'true') {
    config.gradientMode = true;
    config.gradientStart = params.get('gradientStart') || 'FF0000';
    config.gradientEnd = params.get('gradientEnd') || '0000FF';
  }
  if (params.get('showQuote') === 'true') config.showQuote = true;

  // Parse life events: YYYY-MM-DD:icon,...
  if (params.get('lifeEvents')) {
    config.lifeEvents = parseLifeEvents(params.get('lifeEvents')!);
  }

  // Parse photo layers from URL params
  const layers: PhotoLayer[] = [];

  if (params.get('bgImage')) {
    layers.push({
      id: 'bg-url',
      type: 'bg',
      url: params.get('bgImage')!,
      layerSize: 100,
      opacity: 100,
      naturalW: 0,
      naturalH: 0,
      zIndex: 0,
      visible: true,
      panX: parseInt(params.get('bgOffsetX') || '50', 10),
      panY: parseInt(params.get('bgOffsetY') || '50', 10),
    } as BgLayer);
  }

  for (let i = 1; i <= 5; i++) {
    const url = params.get(`cutout${i}Url`);
    if (!url) continue;
    layers.push({
      id: `cutout-url-${i}`,
      type: 'cutout',
      url,
      layerSize: parseInt(params.get(`cutout${i}Scale`) || '60', 10),
      opacity: parseInt(params.get(`cutout${i}Opacity`) || '100', 10),
      naturalW: parseInt(params.get(`cutout${i}W`) || '100', 10),
      naturalH: parseInt(params.get(`cutout${i}H`) || '100', 10),
      zIndex: i,
      visible: true,
      x: parseInt(params.get(`cutout${i}X`) || '50', 10),
      y: parseInt(params.get(`cutout${i}Y`) || '50', 10),
    } as CutoutLayer);
  }

  if (layers.length > 0) config.layers = layers;

  return config;
}

/**
 * Parse life events string: "YYYY-MM-DD:icon,YYYY-MM-DD:icon,..."
 */
export function parseLifeEvents(str: string): LifeEvent[] {
  if (!str) return [];
  return str.split(',').map((entry) => {
    const [date, icon] = entry.split(':');
    // Calculate week index from first event — actual week index is computed at render time
    return { weekIndex: 0, icon: icon || 'star', date };
  });
}

/**
 * Compute week index of a life event given a birthday.
 */
export function lifeEventWeekIndex(birthday: string, eventDate: string): number {
  const birth = new Date(birthday + 'T00:00:00');
  const event = new Date(eventDate + 'T00:00:00');
  const diffMs = event.getTime() - birth.getTime();
  return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
}
