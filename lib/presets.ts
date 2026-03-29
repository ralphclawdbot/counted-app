export interface ThemePreset {
  name: string;
  bg: string;
  dotFilled: string;
  dotEmpty: string;
  dotCurrent: string;
  dotFilledOpacity: number;
  dotEmptyOpacity: number;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    name: 'dark',
    bg: '000000',
    dotFilled: 'FFFFFF',
    dotEmpty: 'FFFFFF',
    dotCurrent: 'FFFFFF',
    dotFilledOpacity: 85,
    dotEmptyOpacity: 10,
  },
  {
    name: 'light',
    bg: 'F5F5F5',
    dotFilled: '333333',
    dotEmpty: '333333',
    dotCurrent: '333333',
    dotFilledOpacity: 90,
    dotEmptyOpacity: 12,
  },
  {
    name: 'amoled',
    bg: '000000',
    dotFilled: 'FFFFFF',
    dotEmpty: 'FFFFFF',
    dotCurrent: '00FF41',
    dotFilledOpacity: 100,
    dotEmptyOpacity: 5,
  },
  {
    name: 'cosmic',
    bg: '0D0221',
    dotFilled: 'E8D5FF',
    dotEmpty: '6B4C9A',
    dotCurrent: 'FF6EC7',
    dotFilledOpacity: 90,
    dotEmptyOpacity: 25,
  },
  {
    name: 'warm',
    bg: '1A0A00',
    dotFilled: 'FFB366',
    dotEmpty: 'FF8C42',
    dotCurrent: 'FFD700',
    dotFilledOpacity: 85,
    dotEmptyOpacity: 15,
  },
  {
    name: 'minimal',
    bg: 'FFFFFF',
    dotFilled: '000000',
    dotEmpty: 'CCCCCC',
    dotCurrent: '000000',
    dotFilledOpacity: 70,
    dotEmptyOpacity: 20,
  },
];
