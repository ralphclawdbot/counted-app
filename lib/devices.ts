import { DeviceInfo, Platform } from '@/types';

// Frame image pixel measurements (alpha-channel scan of each mockuphone PNG):
//   scl/sct = screen top-left in frame image pixels
//   scr/scb = screen bottom-right in frame image pixels
// All frames live in /public/frames/

export interface FrameInfo {
  path: string;
  fw: number; fh: number;          // frame image native size
  scl: number; sct: number;        // screen top-left
  scr: number; scb: number;        // screen bottom-right
}

export interface DeviceGroup {
  platform: Platform;
  label: string;
  devices: DeviceInfo[];
}

// ── Frame presets ────────────────────────────────────────────────────────────
const F15PRO: FrameInfo     = { path:'/frames/apple-iphone-15-pro-black-titanium-portrait.png',    fw:1419, fh:2796, scl:120, sct:120, scr:1299, scb:2676 };
const F15PROMAX: FrameInfo  = { path:'/frames/apple-iphone-15-pro-max-black-titanium-portrait.png', fw:1530, fh:3036, scl:120, sct:120, scr:1410, scb:2916 };
const F14PRO: FrameInfo     = { path:'/frames/apple-iphone-14pro-deeppurple-portrait.png',          fw:1339, fh:2716, scl:80,  sct:80,  scr:1259, scb:2636 };
const F14PROMAX: FrameInfo  = { path:'/frames/apple-iphone-14promax-deeppurple-portrait.png',       fw:1450, fh:2936, scl:80,  sct:70,  scr:1370, scb:2866 };
const F14: FrameInfo        = { path:'/frames/apple-iphone-14-blue-portrait.png',                   fw:1370, fh:2732, scl:100, sct:201, scr:1270, scb:2632 };
const F14PLUS: FrameInfo    = { path:'/frames/apple-iphone-14plus-blue-portrait.png',               fw:1464, fh:2978, scl:90,  sct:202, scr:1374, scb:2888 };
const FSE: FrameInfo        = { path:'/frames/apple-iphone-se-black-portrait.png',                  fw:1050, fh:1934, scl:150, sct:300, scr:900,  scb:1634 };
const F13MINI: FrameInfo    = { path:'/frames/apple-iphone13mini-blue-portrait.png',                fw:1480, fh:2740, scl:200, sct:309, scr:1280, scb:2540 };



// ── Device list ──────────────────────────────────────────────────────────────
export const DEVICES: DeviceInfo[] = [
  // iPhone 16 series — reuse 15 Pro/ProMax frames (same form factor)
  { name: 'iPhone 16 Pro Max', width: 1320, height: 2868, frame: F15PROMAX },
  { name: 'iPhone 16 Pro',     width: 1206, height: 2622, frame: F15PRO    },
  { name: 'iPhone 16 Plus',    width: 1290, height: 2796, frame: F15PROMAX },
  { name: 'iPhone 16',         width: 1179, height: 2556, frame: F15PRO    },

  // iPhone 15 series
  { name: 'iPhone 15 Pro Max', width: 1290, height: 2796, frame: F15PROMAX },
  { name: 'iPhone 15 Pro',     width: 1179, height: 2556, frame: F15PRO    },
  { name: 'iPhone 15 Plus',    width: 1284, height: 2778, frame: F15PROMAX },
  { name: 'iPhone 15',         width: 1179, height: 2556, frame: F15PRO    },

  // iPhone 14 series
  { name: 'iPhone 14 Pro Max', width: 1290, height: 2796, frame: F14PROMAX },
  { name: 'iPhone 14 Pro',     width: 1179, height: 2556, frame: F14PRO    },
  { name: 'iPhone 14',         width: 1170, height: 2532, frame: F14       },

  // Older / smaller
  { name: 'iPhone SE (3rd gen)', width: 750,  height: 1334, frame: FSE     },
  { name: 'iPhone 13 mini',      width: 1080, height: 2340, frame: F13MINI },
];

export const DEFAULT_DEVICE = DEVICES[3]; // iPhone 16 (1179×2556)

// ── Android devices (no frame — CSS generic frame in Canvas) ─────────────────
export const ANDROID_DEVICES: DeviceInfo[] = [
  // Samsung Galaxy S25 series
  { name: 'Samsung Galaxy S25 Ultra', width: 1440, height: 3120, frame: null as unknown as FrameInfo },
  { name: 'Samsung Galaxy S25+',      width: 1080, height: 2340, frame: null as unknown as FrameInfo },
  { name: 'Samsung Galaxy S25',       width: 1080, height: 2340, frame: null as unknown as FrameInfo },
  // Samsung Galaxy S24 series
  { name: 'Samsung Galaxy S24 Ultra', width: 1440, height: 3088, frame: null as unknown as FrameInfo },
  { name: 'Samsung Galaxy S24+',      width: 1080, height: 2340, frame: null as unknown as FrameInfo },
  { name: 'Samsung Galaxy S24',       width: 1080, height: 2340, frame: null as unknown as FrameInfo },
  // Samsung Galaxy A series (mid-range)
  { name: 'Samsung Galaxy A55',       width: 1080, height: 2340, frame: null as unknown as FrameInfo },
  { name: 'Samsung Galaxy A35',       width: 1080, height: 2340, frame: null as unknown as FrameInfo },
  // Google Pixel 9 series
  { name: 'Google Pixel 9 Pro XL',   width: 1344, height: 2992, frame: null as unknown as FrameInfo },
  { name: 'Google Pixel 9 Pro',       width: 1344, height: 2992, frame: null as unknown as FrameInfo },
  { name: 'Google Pixel 9',           width: 1080, height: 2424, frame: null as unknown as FrameInfo },
  // Google Pixel 8 series
  { name: 'Google Pixel 8 Pro',       width: 1344, height: 2992, frame: null as unknown as FrameInfo },
  { name: 'Google Pixel 8',           width: 1080, height: 2400, frame: null as unknown as FrameInfo },
  // Other flagships
  { name: 'OnePlus 13',               width: 1440, height: 3168, frame: null as unknown as FrameInfo },
  { name: 'OnePlus 12',               width: 1440, height: 3168, frame: null as unknown as FrameInfo },
  { name: 'Nothing Phone 2a',         width: 1080, height: 2412, frame: null as unknown as FrameInfo },
  { name: 'Nothing Phone 3',          width: 1080, height: 2408, frame: null as unknown as FrameInfo },
  { name: 'Xiaomi 14 Ultra',          width: 1440, height: 3200, frame: null as unknown as FrameInfo },
  { name: 'Xiaomi 14',                width: 1200, height: 2670, frame: null as unknown as FrameInfo },
];

export const DEFAULT_ANDROID_DEVICE = ANDROID_DEVICES[2]; // Samsung Galaxy S25
