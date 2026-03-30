import { ImageResponse } from 'next/og';
import { WallpaperConfig, BgLayer, CutoutLayer, LifeEvent } from '@/types';
import { weeksLived, dayOfYear, daysInYear, goalProgress, nowInTz } from './calculations';
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

// ── Symbol paths — imported from shared lib ──
import { SYMBOL_PATHS } from './symbols';

// ── Daily Quotes ──
import { QUOTES } from './quotes';

function getDailyQuote(tz?: string): { text: string; author: string } {
  const epoch = new Date('2026-01-01T00:00:00');
  const now = nowInTz(tz);
  const dayIndex = Math.floor((now.getTime() - epoch.getTime()) / (24 * 60 * 60 * 1000));
  const q = QUOTES[((dayIndex % QUOTES.length) + QUOTES.length) % QUOTES.length];
  return { text: q.text, author: q.author };
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

function getDotShadow(dotStyle: string, color: string, isFilled?: boolean): string | undefined {
  void isFilled;
  switch (dotStyle) {
    case 'glow': return `0 0 4px ${color}`;
    case 'neon': return `0 0 4px ${color}, 0 0 8px ${color}`;
    // 'outlined': Satori doesn't support box-shadow spread-radius; render same as flat for now
    default: return undefined;
  }
}

// ── Main Render Function ──

export interface FontEntry {
  name: string;
  data: ArrayBuffer;
}

export async function renderWallpaper(
  config: WallpaperConfig,
  fontData: ArrayBuffer,
  extraFonts?: FontEntry[]
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
      filledDots = weeksLived(config.birthday, config.timezone);
      currentDot = filledDots;
    }
  } else if (config.type === 'year') {
    filledDots = dayOfYear(config.timezone);
    totalDots = daysInYear(new Date().getFullYear());
    currentDot = filledDots;
  } else if (config.type === 'goal') {
    if (config.goalStart && config.deadline) {
      const progress = goalProgress(config.goalStart, config.deadline, config.timezone);
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
  //  │  Full iOS 26 clock overlays the top portion of wallpaper.    │
  //  │  Grid starts at 28% (clock floats above the dots visually).  │
  //  │  safeTop = 28%                                               │
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
  const safeBot = Math.round(height * (config.widgetPosition === 'bottom' ? 0.09 : 0.12)) + (config.widgetPosition === 'bottom' ? widgetH : 0);
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
    // Life calendar: fixed 52 cols (1 year per row); constrain height to ~54% of wallpaper
    // so it has similar visual breathing room to the year type grid
    columns = 52;
    const cellByW = Math.floor(availW / columns);
    const lifeTotalRows = Math.ceil(totalDots / columns);
    const maxLifeH = Math.round(height * 0.54);
    const cellByH = Math.floor(Math.min(usableH, maxLifeH) / lifeTotalRows);
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
      const shadow = getDotShadow(config.dotStyle, hexToRgba(dotColor, dotOpacity), isFilled);

      // Symbol mode for events
      if (isEvent && config.dotMode !== 'emoji') {
        const icon = eventMap.get(idx) || 'star';
        const pathD = SYMBOL_PATHS[icon] || SYMBOL_PATHS.star;
        dotsInRow.push(
          <svg key={idx} width={dotSize} height={dotSize} viewBox="0 0 24 24">
            <path d={pathD} fill="#FFD700" />
          </svg>
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
      // Symbol mode — inline SVG (satori renders paths natively, no data URI needed)
      if (config.dotMode === 'symbol') {
        const pathD = SYMBOL_PATHS[config.dotSymbol || 'heart'] || SYMBOL_PATHS.heart;
        dotsInRow.push(
          <svg key={idx} width={dotSize} height={dotSize} viewBox="0 0 24 24" style={{ opacity: dotOpacity / 100 }}>
            <path d={pathD} fill={`#${dotColor}`} />
          </svg>
        );
        continue;
      }

      if (isCurrent && !isEvent) {
        // Solid accent dot for today
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
      } else if (config.dotStyle === 'outlined' && !isFilled) {
        // Outlined style: empty dots render as hollow rings with a border (satori supports border)
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

  // ── Bottom zone geometry (defined early — used by goal name + stats + quote) ──
  const _btnSize   = Math.round(width * 0.155);
  const _btnMargin = Math.round(width * 0.07);
  const _btnGap    = Math.round(width * 0.07);
  const _quoteFontPx  = Math.round(width * 0.024);
  const _statsBottom = config.showQuote ? Math.round(height * 0.055) : Math.round(height * 0.075);
  const _quoteBottom = Math.round(height * 0.085);

  // Goal name element — stacks above quote when quote is enabled
  // Layout from bottom: stats → quote → goal name
  // Without quote: goal name at 10.5% from bottom (above stats at 7.5%)
  // With quote: goal name sits above the quote block (~quote bottom + quote height + gap)
  const _goalNameBottom = config.showQuote
    ? Math.round(_quoteBottom + 2.6 * _quoteFontPx + 14)
    : Math.round(height * 0.105);

  let goalNameElement: React.ReactElement | null = null;
  if (config.type === 'goal' && config.goalName) {
    goalNameElement = (
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          bottom: _goalNameBottom,
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

  // (bottom zone geometry already defined above — used by goal name element)

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
    const quote = getDailyQuote(config.timezone);
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
            flexDirection: 'column',
            alignItems: 'center',
            gap: Math.round(_quoteFontPx * 0.35),
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
            {quote.text}
          </div>
          <div
            style={{
              display: 'flex',
              color: hexToRgba(config.dotFilled, 45),
              fontSize: Math.round(_quoteFontPx * 0.85),
              fontStyle: 'normal',
              textAlign: 'center',
              fontFamily,
            }}
          >
            {quote.author}
          </div>
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
        background: config.transparentBg ? 'transparent' : `#${config.bg}`,
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
      { name: 'Inter', data: fontData, style: 'normal', weight: 400 },
      ...(extraFonts ?? []).map((f) => ({ name: f.name, data: f.data, style: 'normal' as const, weight: 400 as const })),
    ],
  });
}
