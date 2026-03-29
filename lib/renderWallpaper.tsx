import { ImageResponse } from 'next/og';
import { WallpaperConfig, BgLayer, CutoutLayer, LifeEvent } from '@/types';
import { weeksLived, dayOfYear, goalProgress } from './calculations';
import { lifeEventWeekIndex } from './buildConfig';

import { hexToRgba, lerpHex } from './colors';

// ── Re-exports for convenience ──
export { hexToRgba, lerpHex };

export async function fetchAsDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'image/png';
    const base64 = Buffer.from(buf).toString('base64');
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}

// ── Symbol SVG Map ──

const SYMBOLS: Record<string, string> = {
  heart: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
  leaf: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.71c.83.33 1.72.53 2.64.58.39.02.78.01 1.16-.04C13.72 19.2 20 14.22 20 6c-1 0-2.3.39-3 1z"/></svg>',
  flower: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c4.97 0 9-4.03 9-9-4.97 0-9 4.03-9 9zM5.6 10.25c0 1.38 1.12 2.5 2.5 2.5.53 0 1.01-.16 1.42-.44l-.02.19c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5l-.02-.19c.4.28.89.44 1.42.44 1.38 0 2.5-1.12 2.5-2.5 0-1-.59-1.85-1.43-2.25.84-.4 1.43-1.25 1.43-2.25 0-1.38-1.12-2.5-2.5-2.5-.53 0-1.01.16-1.42.44l.02-.19C14.5 2.12 13.38 1 12 1S9.5 2.12 9.5 3.5l.02.19c-.4-.28-.89-.44-1.42-.44-1.38 0-2.5 1.12-2.5 2.5 0 1 .59 1.85 1.43 2.25-.84.4-1.43 1.25-1.43 2.25zM12 5.5c1.38 0 2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5S9.5 9.38 9.5 8s1.12-2.5 2.5-2.5zM3 13c0 4.97 4.03 9 9 9 0-4.97-4.03-9-9-9z"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.37 5.51A7.35 7.35 0 0 0 9.1 7.5c0 4.08 3.32 7.4 7.4 7.4.68 0 1.35-.09 1.99-.27A7.014 7.014 0 0 1 12 19c-3.86 0-7-3.14-7-7 0-2.93 1.81-5.45 4.37-6.49zM12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/></svg>',
  snow: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 11h-4.17l2.54-2.54-1.42-1.42L15 11h-2V9l3.96-3.96-1.42-1.42L13 6.17V2h-2v4.17L8.46 3.63 7.04 5.04 11 9v2H9L5.04 7.04 3.63 8.46 6.17 11H2v2h4.17l-2.54 2.54 1.42 1.42L9 13h2v2l-3.96 3.96 1.42 1.42L11 17.83V22h2v-4.17l2.54 2.54 1.42-1.42L13 15v-2h2l3.96 3.96 1.42-1.42L17.83 13H22z"/></svg>',
};

export function symbolSvgUri(name: string, color: string): string {
  const svg = SYMBOLS[name] || SYMBOLS.star;
  const colored = svg.replace('currentColor', `#${color}`);
  return `data:image/svg+xml;base64,${btoa(colored)}`;
}

// ── Daily Quotes ──

const QUOTES = [
  "The only way to do great work is to love what you do.",
  "Life is what happens when you're busy making other plans.",
  "In the end, it's not the years in your life that count. It's the life in your years.",
  "The purpose of our lives is to be happy.",
  "Life is really simple, but we insist on making it complicated.",
  "The unexamined life is not worth living.",
  "Turn your wounds into wisdom.",
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "Your time is limited, don't waste it living someone else's life.",
  "Life shrinks or expands in proportion to one's courage.",
  "Every moment is a fresh beginning.",
  "The only impossible journey is the one you never begin.",
  "What we think, we become.",
  "Be the change that you wish to see in the world.",
  "Not all those who wander are lost.",
  "It is during our darkest moments that we must focus to see the light.",
  "The way to get started is to quit talking and begin doing.",
  "Everything you've ever wanted is on the other side of fear.",
  "Happiness is not something ready made. It comes from your own actions.",
  "The biggest adventure you can take is to live the life of your dreams.",
  "Life is short, and it is up to you to make it sweet.",
  "Go confidently in the direction of your dreams.",
  "Believe you can and you're halfway there.",
  "Life is 10% what happens to us and 90% how we react to it.",
  "An unexamined life is not worth living.",
  "The best revenge is massive success.",
  "Life is a journey, not a destination.",
  "You only live once, but if you do it right, once is enough.",
  "Many of life's failures are people who did not realize how close they were to success when they gave up.",
  "If life were predictable it would cease to be life, and be without flavor.",
];

function getDailyQuote(): string {
  const epoch = new Date('2026-01-01T00:00:00');
  const now = new Date();
  const dayIndex = Math.floor((now.getTime() - epoch.getTime()) / (24 * 60 * 60 * 1000));
  return QUOTES[((dayIndex % QUOTES.length) + QUOTES.length) % QUOTES.length];
}

// ── Dot Rendering Helpers ──

function getBorderRadius(shape: string, dotSize: number): string {
  switch (shape) {
    case 'circle': return '50%';
    case 'rounded': return `${Math.round(dotSize * 0.28)}px`;
    case 'diamond': return '30% 0';
    default: return '2px'; // square
  }
}

function getDotShadow(dotStyle: string, color: string): string | undefined {
  switch (dotStyle) {
    case 'glow': return `0 0 4px ${color}`;
    case 'neon': return `0 0 4px ${color}, 0 0 8px ${color}`;
    default: return undefined;
  }
}

// ── Main Render Function ──

export async function renderWallpaper(
  config: WallpaperConfig,
  fontData: ArrayBuffer
): Promise<ImageResponse> {
  const { width, height } = config;

  // Horizontal params — 9% padding each side
  const hPad = Math.round(width * 0.09);
  const availW = width - hPad * 2;

  // Compute total dots
  let totalDots = 0;
  let filledDots = 0;
  let currentDot = -1;

  if (config.type === 'life') {
    const lifespan = config.lifespan || 80;
    totalDots = lifespan * 52;
    if (config.birthday) {
      filledDots = weeksLived(config.birthday);
      currentDot = filledDots;
    }
  } else if (config.type === 'year') {
    totalDots = 365;
    filledDots = dayOfYear();
    currentDot = filledDots;
  } else if (config.type === 'goal') {
    if (config.goalStart && config.deadline) {
      const progress = goalProgress(config.goalStart, config.deadline);
      totalDots = progress.total;
      filledDots = progress.elapsed;
      currentDot = filledDots;
    }
  }

  const statsTextSize = Math.round(width * 0.028);

  // iOS lock screen safe zones (calibrated from real device):
  // Dynamic Island + time + date: top ~0–33%
  // Camera/flashlight buttons: bottom ~12–18%
  // Lock screen widgets (when enabled): extra ~13% strip above camera buttons
  // Widget strip height = 13% of wallpaper height
  // iOS lock screen layout (confirmed from real device screenshots):
  //
  //  ┌─ widgetPosition: 'top' ──────────────────────────────────────┐
  //  │  iOS compacts the clock and shows widgets in the top area.   │
  //  │  Widgets typically end at ~38%. Grid starts at 38%.          │
  //  │  safeTop = 38%                                               │
  //  └──────────────────────────────────────────────────────────────┘
  //
  //  ┌─ widgetPosition: 'none' ─────────────────────────────────────┐
  //  │  Full iOS 26 clock (huge, ~14–36% of screen).                │
  //  │  Need more breathing room below clock → grid starts at 46%.  │
  //  │  safeTop = 46%                                               │
  //  └──────────────────────────────────────────────────────────────┘
  //
  //  ┌─ widgetPosition: 'bottom' ───────────────────────────────────┐
  //  │  No top widget, so same safeTop as 'top'. Bottom gets extra.  │
  //  │  safeTop = 38%, safeBot = 12% + widgetH                      │
  //  └──────────────────────────────────────────────────────────────┘
  const widgetH = Math.round(height * 0.13);
  // top widget:    38% — iOS widgets fill top area, grid starts right below them
  // no widget:     28% — grid starts high, iOS clock overlays on top visually
  // bottom widget: 28% — no top widgets so same as none; extra space reserved at bottom
  const safeTopFrac = config.widgetPosition === 'top' ? 0.38 : 0.28;
  const safeTop = Math.round(height * safeTopFrac);
  const safeBot = Math.round(height * 0.12) + (config.widgetPosition === 'bottom' ? widgetH : 0);
  const statsAreaH = Math.round(height * 0.055);
  const usableH = height - safeTop - safeBot - statsAreaH;

  // ── Equal-gap grid sizing ──
  // Scan from large to small to find the biggest square cellSize that fits:
  //   cols = floor(availW / cellSize), rows = ceil(totalDots / cols)
  //   grid fits when rows * cellSize ≤ usableH
  // Result: horizGap === vertGap === (cellSize - dotSize) — perfectly uniform spacing.
  let columns: number;
  let cellSize: number;

  if (config.type === 'life') {
    // Life calendar: fixed 52 cols (1 year per row); derive cellSize from the tighter axis
    columns = 52;
    const cellByW = Math.floor(availW / columns);
    const lifeTotalRows = Math.ceil(totalDots / columns);
    const cellByH = Math.floor(usableH / lifeTotalRows);
    cellSize = Math.min(cellByW, cellByH);
  } else {
    // Year / goal: find largest square cellSize where all dots fit in safe zone
    const maxCs = Math.min(availW, usableH);
    cellSize = 1;
    for (let cs = maxCs; cs >= 1; cs--) {
      const c = Math.floor(availW / cs);
      if (c < 1) continue;
      const r = Math.ceil(totalDots / c);
      if (r * cs <= usableH) { cellSize = cs; break; }
    }
    columns = Math.floor(availW / cellSize);
  }

  const totalRows = Math.ceil(totalDots / columns);
  const gapScale   = Math.max(0.3, Math.min(3.0, config.dotGapScale ?? 1));
  const dotFrac    = Math.max(0.30, Math.min(0.95, 1 - 0.22 * gapScale));
  const dotSize    = Math.floor(cellSize * dotFrac);
  const gap        = cellSize - dotSize;  // identical horizontal AND vertical gap
  const horizGap = gap;
  const vertGap  = gap;

  const gridW = columns * dotSize + (columns - 1) * gap;
  const gridH = totalRows * dotSize + (totalRows - 1) * gap;
  // Centre grid in available space
  const topOffset  = safeTop  + Math.max(0, Math.floor((usableH  - gridH) / 2));
  const leftOffset = hPad + Math.max(0, Math.floor((availW - gridW) / 2));

  // Build progress stats text
  let statsLine = '';
  if (config.type === 'year') {
    const remaining = totalDots - filledDots;
    const pct = totalDots > 0 ? Math.round((filledDots / totalDots) * 100) : 0;
    statsLine = `${remaining}d left · ${pct}%`;
  } else if (config.type === 'goal' && config.goalStart && config.deadline) {
    const remaining = totalDots - filledDots;
    const pct = totalDots > 0 ? Math.round((filledDots / totalDots) * 100) : 0;
    statsLine = `${remaining}d left · ${pct}%`;
  } else if (config.type === 'life' && config.birthday) {
    const lifespan = config.lifespan || 80;
    const remaining = totalDots - filledDots;
    const pct = totalDots > 0 ? Math.round((filledDots / totalDots) * 100) : 0;
    const yearsLeft = Math.round(remaining / 52);
    statsLine = `${yearsLeft}y left · ${pct}% lived`;
    void lifespan;
  }

  // Build life events map
  const eventMap = new Map<number, string>();
  if (config.lifeEvents && config.birthday) {
    for (const evt of config.lifeEvents) {
      const weekIdx = lifeEventWeekIndex(config.birthday, evt.date);
      eventMap.set(weekIdx, evt.icon);
    }
  }

  // Fetch all images to base64
  const imageUris: Map<string, string> = new Map();
  if (config.layers && config.layers.length > 0) {
    const urls = config.layers
      .filter((l) => l.visible && l.url)
      .map((l) => l.url);
    const results = await Promise.all(urls.map((u) => fetchAsDataUri(u)));
    urls.forEach((u, i) => {
      if (results[i]) imageUris.set(u, results[i]!);
    });
  }

  // Build dot rows
  const dotRows: React.ReactElement[] = [];
  for (let row = 0; row < totalRows; row++) {
    const dotsInRow: React.ReactElement[] = [];
    for (let col = 0; col < columns; col++) {
      const idx = row * columns + col;
      if (idx >= totalDots) break;

      const isEvent = eventMap.has(idx);
      const isFilled = idx < filledDots;
      const isCurrent = idx === currentDot;

      let dotColor: string;
      let dotOpacity: number;

      if (isEvent) {
        dotColor = 'FFD700';
        dotOpacity = 100;
      } else if (config.gradientMode && config.gradientStart && config.gradientEnd) {
        const t = totalDots > 1 ? idx / (totalDots - 1) : 0;
        dotColor = lerpHex(config.gradientStart, config.gradientEnd, t);
        dotOpacity = isFilled ? config.dotFilledOpacity : config.dotEmptyOpacity;
      } else if (isCurrent) {
        dotColor = config.dotCurrent;
        dotOpacity = 100;
      } else if (isFilled) {
        dotColor = config.dotFilled;
        dotOpacity = config.dotFilledOpacity;
      } else {
        dotColor = config.dotEmpty;
        dotOpacity = config.dotEmptyOpacity;
      }

      const borderRadius = getBorderRadius(config.dotShape, dotSize);
      const shadow = getDotShadow(config.dotStyle, hexToRgba(dotColor, dotOpacity));

      // Symbol mode for events
      if (isEvent && config.dotMode !== 'emoji') {
        const icon = eventMap.get(idx) || 'star';
        const svgUri = symbolSvgUri(icon, 'FFD700');
        dotsInRow.push(
          <img
            key={idx}
            alt=""
            src={svgUri}
            width={dotSize}
            height={dotSize}
            style={{ width: dotSize, height: dotSize }}
          />
        );
        continue;
      }

      // Emoji mode
      if (config.dotMode === 'emoji') {
        const ch = isFilled || isCurrent ? (config.emojiLived || '🌳') : (config.emojiEmpty || '🌑');
        dotsInRow.push(
          <div key={idx} style={{ width: dotSize, height: dotSize, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: dotSize * 0.75, lineHeight: 1, userSelect: 'none' }}>
            {ch}
          </div>
        );
        continue;
      }
      // Symbol mode
      if (config.dotMode === 'symbol') {
        const svgUri = symbolSvgUri(config.dotSymbol || 'heart', dotColor);
        dotsInRow.push(
          <img key={idx} alt="" src={svgUri} width={dotSize} height={dotSize} style={{ width: dotSize, height: dotSize, opacity: dotOpacity / 100 }} />
        );
        continue;
      }

      if (isCurrent && !isEvent) {
        // Solid accent dot for today (no hollow ring — matches reference aesthetic)
        const shadow = getDotShadow(config.dotStyle, hexToRgba(config.dotCurrent, 100));
        dotsInRow.push(
          <div
            key={idx}
            style={{
              display: 'flex',
              width: dotSize,
              height: dotSize,
              borderRadius,
              background: hexToRgba(config.dotCurrent, 100),
              ...(shadow ? { boxShadow: shadow } : {}),
            }}
          />
        );
      } else if (config.dotStyle === 'outlined' && !isFilled && !isEvent) {
        dotsInRow.push(
          <div
            key={idx}
            style={{
              display: 'flex',
              width: dotSize,
              height: dotSize,
              borderRadius,
              border: `1px solid ${hexToRgba(dotColor, dotOpacity)}`,
              background: 'transparent',
            }}
          />
        );
      } else {
        dotsInRow.push(
          <div
            key={idx}
            style={{
              display: 'flex',
              width: dotSize,
              height: dotSize,
              borderRadius,
              background: hexToRgba(dotColor, dotOpacity),
              ...(shadow ? { boxShadow: shadow } : {}),
            }}
          />
        );
      }
    }

    const rowAlign = config.dotRowAlign || 'left';
    const justifyContent =
      rowAlign === 'right' ? 'flex-end' :
      rowAlign === 'center' ? 'center' : 'flex-start';

    dotRows.push(
      <div
        key={`row-${row}`}
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: horizGap,
          width: gridW,           // fixed so justifyContent works on partial rows
          justifyContent,
        }}
      >
        {dotsInRow}
      </div>
    );
  }

  // Build layer elements
  const layerElements: React.ReactElement[] = [];
  if (config.layers) {
    const sortedLayers = [...config.layers]
      .filter((l) => l.visible)
      .sort((a, b) => a.zIndex - b.zIndex);

    for (const layer of sortedLayers) {
      const dataUri = imageUris.get(layer.url);
      if (!dataUri) continue;

      if (layer.type === 'bg') {
        const bg = layer as BgLayer;
        const bgStyle: Record<string, unknown> = {
          position: 'absolute' as const,
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover' as const,
          objectPosition: `${bg.panX}% ${bg.panY}%`,
          opacity: layer.opacity / 100,
        };
        if (config.bgBlur && config.bgBlur > 0) {
          bgStyle.filter = `blur(${config.bgBlur}px)`;
        }
        layerElements.push(
          <img key={layer.id} alt="" src={dataUri} style={bgStyle} />
        );
        // Dim overlay
        if (config.bgDim && config.bgDim > 0) {
          layerElements.push(
            <div
              key={`${layer.id}-dim`}
              style={{
                display: 'flex',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: `rgba(0,0,0,${config.bgDim / 100})`,
              }}
            />
          );
        }
      } else if (layer.type === 'cutout') {
        const cut = layer as CutoutLayer;
        const w = width * (cut.layerSize / 100);
        const h = w * (cut.naturalH / cut.naturalW);
        const left = (cut.x / 100) * width - w / 2;
        const top = (cut.y / 100) * height - h / 2;
        layerElements.push(
          <img
            key={layer.id}
            alt=""
            src={dataUri}
            style={{
              position: 'absolute',
              left,
              top,
              width: w,
              height: h,
              opacity: cut.opacity / 100,
            }}
          />
        );
      }
    }
  }

  const fontFamily = config.fontFamily || 'Inter';

  // Goal name element (shown above stats if goal type)
  let goalNameElement: React.ReactElement | null = null;
  if (config.type === 'goal' && config.goalName) {
    goalNameElement = (
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          bottom: Math.round(height * 0.105),
          left: hPad,
          right: hPad,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            color: hexToRgba(config.dotFilled, 80),
            fontSize: Math.round(width * 0.035),
            fontWeight: 600,
            textAlign: 'center',
            fontFamily,
          }}
        >
          {config.goalName}
        </div>
      </div>
    );
  }

  // ── Bottom zone geometry (shared by stats + quote) ──────────────────────
  // Horizontal: centered between the flashlight and camera buttons
  const _btnSize   = Math.round(width * 0.155);
  const _btnMargin = Math.round(width * 0.07);
  const _btnGap    = Math.round(width * 0.045); // ~4.5% extra gap each side (was 2.5%)
  const _quoteFontPx  = Math.round(width * 0.028);
  // Vertical positioning (Arthur's spec):
  // • With quote: stats at 5%, quote at 8.5% from bottom
  // • Without quote: stats at 7% from bottom
  const _statsBottom = config.showQuote
    ? Math.round(height * 0.055)
    : Math.round(height * 0.07);
  const _quoteBottom = Math.round(height * 0.085);

  // Progress stats element (always shown if we have data)
  const statsElement: React.ReactElement | null = statsLine ? (
    <div
      style={{
        display: 'flex',
        position: 'absolute',
        bottom: _statsBottom,
        left: 0,
        right: 0,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          color: hexToRgba(config.dotCurrent, 85),
          fontSize: statsTextSize,
          letterSpacing: 1,
          fontWeight: 400,
          fontFamily,
        }}
      >
        {statsLine}
      </div>
    </div>
  ) : null;

  // Quote element — centered horizontally between the two lock-screen buttons,
  // vertically centered in the button zone (mirrors Canvas overlay positioning)
  let quoteElement: React.ReactElement | null = null;
  if (config.showQuote) {
    const quote = getDailyQuote();
    quoteElement = (
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          bottom: _quoteBottom,
          left:  _btnMargin + _btnSize + _btnGap,
          right: _btnMargin + _btnSize + _btnGap,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            color: hexToRgba(config.dotFilled, 65),
            fontSize: _quoteFontPx,
            fontStyle: 'italic',
            textAlign: 'center',
            fontFamily,
          }}
        >
          {quote}
        </div>
      </div>
    );
  }

  const jsx = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width,
        height,
        background: `#${config.bg}`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Photo layers */}
      {layerElements}

      {/* Dot grid — absolutely positioned for pixel-perfect placement */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          position: 'absolute',
          top: topOffset,
          left: leftOffset,
          gap: vertGap,
        }}
      >
        {dotRows}
      </div>

      {/* Goal name */}
      {goalNameElement}

      {/* Progress stats */}
      {statsElement}

      {/* Quote */}
      {quoteElement}
    </div>
  );

  return new ImageResponse(jsx, {
    width,
    height,
    fonts: [
      {
        name: 'Inter',
        data: fontData,
        style: 'normal',
        weight: 400,
      },
    ],
  });
}
