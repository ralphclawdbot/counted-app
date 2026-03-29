import { DeviceInfo } from '@/types';

export const DEVICES: DeviceInfo[] = [
  { name: 'iPhone 16 Pro Max', width: 1320, height: 2868 },
  { name: 'iPhone 16 Pro', width: 1206, height: 2622 },
  { name: 'iPhone 16 Plus', width: 1290, height: 2796 },
  { name: 'iPhone 16', width: 1179, height: 2556 },
  { name: 'iPhone 15 Pro Max', width: 1290, height: 2796 },
  { name: 'iPhone 15 Pro', width: 1179, height: 2556 },
  { name: 'iPhone 15 Plus', width: 1284, height: 2778 },
  { name: 'iPhone 15', width: 1179, height: 2556 },
  { name: 'iPhone 14 Pro Max', width: 1290, height: 2796 },
  { name: 'iPhone 14 Pro', width: 1179, height: 2556 },
  { name: 'iPhone 14', width: 1170, height: 2532 },
  { name: 'iPhone SE (3rd gen)', width: 750, height: 1334 },
  { name: 'iPhone 13 mini', width: 1080, height: 2340 },
];

export const DEFAULT_DEVICE = DEVICES[3]; // iPhone 16 (1179×2556)
