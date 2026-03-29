export interface ThemePreset {
  name: string;
  label: string;
  emoji: string;
  bg: string;
  dotFilled: string;
  dotEmpty: string;
  dotCurrent: string;
  dotFilledOpacity: number;
  dotEmptyOpacity: number;
}

export const THEME_PRESETS: ThemePreset[] = [
  { name: 'midnight', label: 'Midnight', emoji: '🌑', bg: '0a0a0f', dotFilled: 'e8e8ff', dotEmpty: '3a3a5c', dotCurrent: '7c6fff', dotFilledOpacity: 95, dotEmptyOpacity: 20 },
  { name: 'blaze', label: 'Blaze', emoji: '🔥', bg: '0d0400', dotFilled: 'ff6b2b', dotEmpty: '3d1500', dotCurrent: 'ffd93d', dotFilledOpacity: 100, dotEmptyOpacity: 18 },
  { name: 'aurora', label: 'Aurora', emoji: '🌌', bg: '020b14', dotFilled: '7fffd4', dotEmpty: '0d3348', dotCurrent: 'ff6ec7', dotFilledOpacity: 90, dotEmptyOpacity: 20 },
  { name: 'cherry', label: 'Cherry', emoji: '🌸', bg: '1a0010', dotFilled: 'ffb3d1', dotEmpty: '4d0030', dotCurrent: 'ff69b4', dotFilledOpacity: 85, dotEmptyOpacity: 20 },
  { name: 'goldRush', label: 'Gold Rush', emoji: '✨', bg: '080600', dotFilled: 'ffd700', dotEmpty: '2a1f00', dotCurrent: 'fff5a0', dotFilledOpacity: 100, dotEmptyOpacity: 15 },
  { name: 'neon', label: 'Neon', emoji: '⚡', bg: '010106', dotFilled: '00f5ff', dotEmpty: '0a0020', dotCurrent: 'ff00ff', dotFilledOpacity: 100, dotEmptyOpacity: 12 },
  { name: 'forest', label: 'Forest', emoji: '🌲', bg: '030d04', dotFilled: '6fcf79', dotEmpty: '0d2410', dotCurrent: 'a8ff78', dotFilledOpacity: 90, dotEmptyOpacity: 18 },
  { name: 'roseGold', label: 'Rose Gold', emoji: '💎', bg: '1a0a0d', dotFilled: 'f4a0b5', dotEmpty: '3d1020', dotCurrent: 'ffcdd8', dotFilledOpacity: 90, dotEmptyOpacity: 18 },
  { name: 'ocean', label: 'Ocean', emoji: '🌊', bg: '00080f', dotFilled: '4fc3f7', dotEmpty: '0a2030', dotCurrent: '80deea', dotFilledOpacity: 90, dotEmptyOpacity: 20 },
  { name: 'mono', label: 'Mono', emoji: '◻️', bg: '000000', dotFilled: 'ffffff', dotEmpty: 'ffffff', dotCurrent: 'ffffff', dotFilledOpacity: 85, dotEmptyOpacity: 10 },
  { name: 'infrared', label: 'Infrared', emoji: '🌡️', bg: '050000', dotFilled: 'ff3030', dotEmpty: '1a0000', dotCurrent: 'ff8c00', dotFilledOpacity: 100, dotEmptyOpacity: 15 },
  { name: 'sage', label: 'Sage', emoji: '🍃', bg: '050a06', dotFilled: '9dc38d', dotEmpty: '1a2b1c', dotCurrent: 'c5e8ba', dotFilledOpacity: 85, dotEmptyOpacity: 20 },
];
