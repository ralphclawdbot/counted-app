import { WallpaperConfig, PhotoLayer, BgLayer, CutoutLayer, LifeEvent } from '@/types';

/**
 * Serialize a WallpaperConfig into URLSearchParams for the /api/wallpaper endpoint.
 * Used by both the Canvas live preview and the download link in page.tsx.
 * NOTE: photo layers are intentionally excluded — they're rendered via CSS CanvasLayer.
 */
export function configToWallpaperParams(config: WallpaperConfig): URLSearchParams {
  const p = new URLSearchParams({
    type: config.type,
    width: String(config.width),
    height: String(config.height),
    bg: config.bg.replace(/^#/, ''),
    dotFilled: config.dotFilled.replace(/^#/, ''),
    dotEmpty: config.dotEmpty.replace(/^#/, ''),
    dotCurrent: config.dotCurrent.replace(/^#/, ''),
    dotFilledOpacity: String(config.dotFilledOpacity),
    dotEmptyOpacity: String(config.dotEmptyOpacity),
    dotShape: config.dotShape,
    dotStyle: config.dotStyle,
    dotMode: config.dotMode,
  });
  if (config.birthday)       p.set('birthday', config.birthday);
  if (config.lifespan)       p.set('lifespan', String(config.lifespan));
  if (config.deadline)       p.set('deadline', config.deadline);
  if (config.goalStart)      p.set('goalStart', config.goalStart);
  if (config.widgetPosition) p.set('widgetPosition', config.widgetPosition);
  if (config.dotRowAlign)    p.set('dotRowAlign', config.dotRowAlign);
  if (config.dotGapScale && config.dotGapScale !== 1) p.set('dotGapScale', String(config.dotGapScale));
  if (config.showQuote)      p.set('showQuote', 'true');
  if (config.timezone)       p.set('tz', config.timezone);
  if (config.goalName)       p.set('goalName', config.goalName);
  if (config.fontFamily)     p.set('fontFamily', config.fontFamily);
  if (config.emojiLived)     p.set('emojiLived', config.emojiLived);
  if (config.emojiEmpty)     p.set('emojiEmpty', config.emojiEmpty);
  if (config.dotSymbol)      p.set('dotSymbol', config.dotSymbol);
  if (config.bgBlur)         p.set('bgBlur', String(config.bgBlur));
  if (config.bgDim)          p.set('bgDim', String(config.bgDim));
  if (config.gradientMode) {
    p.set('gradientMode', 'true');
    if (config.gradientStart) p.set('gradientStart', config.gradientStart.replace(/^#/, ''));
    if (config.gradientEnd)   p.set('gradientEnd', config.gradientEnd.replace(/^#/, ''));
  }
  if (config.lifeEvents?.length) {
    p.set('lifeEvents', config.lifeEvents.map((e) => `${e.date}:${e.icon}`).join(','));
  }
  return p;
}

/**
 * Parse URL search params into a WallpaperConfig object.
 */
export function parseConfigFromParams(params: URLSearchParams): WallpaperConfig {
  const config: WallpaperConfig = {
    type: (params.get('type') as WallpaperConfig['type']) || 'life',
    width: parseInt(params.get('width') || '1179', 10),
    height: parseInt(params.get('height') || '2556', 10),
    bg: (params.get('bg') || '000000').replace(/^#/, ''),
    dotFilled: (params.get('dotFilled') || 'FFFFFF').replace(/^#/, ''),
    dotEmpty: (params.get('dotEmpty') || 'FFFFFF').replace(/^#/, ''),
    dotCurrent: (params.get('dotCurrent') || 'FFFFFF').replace(/^#/, ''),
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
    config.gradientStart = (params.get('gradientStart') || 'FF0000').replace(/^#/, '');
    config.gradientEnd = (params.get('gradientEnd') || '0000FF').replace(/^#/, '');
  }
  if (params.get('showQuote') === 'true') config.showQuote = true;
  const dotGapScale = parseFloat(params.get('dotGapScale') ?? '');
  if (!isNaN(dotGapScale)) config.dotGapScale = Math.max(0.3, Math.min(3.0, dotGapScale));
  const tz = params.get('tz');
  if (tz) config.timezone = tz;
  if (params.get('dotRowAlign')) config.dotRowAlign = params.get('dotRowAlign') as 'left' | 'center' | 'right';
  if (params.get('deviceName')) config.deviceName = params.get('deviceName')!;
  if (params.get('widgetPosition')) config.widgetPosition = params.get('widgetPosition') as 'none' | 'bottom' | 'top';
  if (params.get('goalName')) config.goalName = params.get('goalName')!;
  if (params.get('fontFamily')) config.fontFamily = params.get('fontFamily')!;

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
