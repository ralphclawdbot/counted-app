// ── Photo Layer Types (discriminated union) ──

export interface BaseLayer {
  id: string;
  url: string;
  layerSize: number;   // % of full device width (10–200)
  opacity: number;     // 0–100
  naturalW: number;
  naturalH: number;
  zIndex: number;
  visible: boolean;
}

export interface BgLayer extends BaseLayer {
  type: 'bg';
  panX: number;  // 0–100, default 50
  panY: number;  // 0–100, default 50
}

export interface CutoutLayer extends BaseLayer {
  type: 'cutout';
  x: number;  // center anchor % from left (0–100)
  y: number;  // center anchor % from top (0–100)
}

export type PhotoLayer = BgLayer | CutoutLayer;

// ── Life Event ──

export interface LifeEvent {
  weekIndex: number;
  icon: string;   // heart | star | leaf | flower | moon | snow
  date: string;   // YYYY-MM-DD
}

// ── Calendar Types ──

export type CalendarType = 'life' | 'year' | 'goal';
export type DotRowAlign = 'left' | 'center' | 'right';
export type WidgetPosition = 'none' | 'bottom' | 'top';
export type DotShape = 'circle' | 'square' | 'rounded' | 'diamond';
export type DotStyle = 'flat' | 'glow' | 'neon' | 'outlined';
export type DotMode = 'standard' | 'emoji' | 'symbol';
export type Platform = 'ios' | 'android';

// ── Full Wallpaper Config ──

export interface WallpaperConfig {
  type: CalendarType;
  width: number;
  height: number;
  birthday?: string;
  lifespan?: number;
  deadline?: string;
  goalStart?: string;
  bg: string;
  dotFilled: string;
  dotEmpty: string;
  dotCurrent: string;
  dotFilledOpacity: number;
  dotEmptyOpacity: number;
  dotShape: DotShape;
  dotStyle: DotStyle;
  dotMode: DotMode;
  emojiLived?: string;
  emojiEmpty?: string;
  dotSymbol?: string;
  bgBlur?: number;
  bgDim?: number;
  dotRowAlign?: DotRowAlign;
  deviceName?: string;
  safeLayout?: boolean;
  /** Widget position on iOS lock screen: none | bottom (default) | top (iOS 26+) */
  widgetPosition?: WidgetPosition;
  gradientMode?: boolean;
  gradientStart?: string;
  gradientEnd?: string;
  showQuote?: boolean;
  goalName?: string;
  fontFamily?: string;
  dotGapScale?: number;   // gap multiplier: 0.5 (tight) → 1.0 (default) → 3.0 (spacious)
  platform?: Platform;    // 'ios' (default) | 'android'
  lifeEvents?: LifeEvent[];
  layers?: PhotoLayer[];
}

// ── Device Info ──

export interface DeviceInfo {
  name: string;
  width: number;
  height: number;
  frame: import('@/lib/devices').FrameInfo | null;
}
