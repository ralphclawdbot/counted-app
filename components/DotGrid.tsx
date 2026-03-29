'use client';

import React, { useMemo } from 'react';
import { WallpaperConfig, LifeEvent } from '@/types';
import { weeksLived, dayOfYear, goalProgress } from '@/lib/calculations';
import { lifeEventWeekIndex } from '@/lib/buildConfig';
import { hexToRgba, lerpHex } from '@/lib/colors';

interface DotGridProps {
  config: WallpaperConfig;
  canvasScale: number;
  canvasWidth: number;
  canvasHeight: number;
  onDotClick?: (weekIndex: number) => void;
}

export default function DotGrid({ config, canvasScale, canvasWidth, canvasHeight, onDotClick }: DotGridProps) {
  const gridData = useMemo(() => {
    const fullWidth = config.width;
    const fullHeight = config.height;
    const hPad = Math.round(fullWidth * 0.09);
    const availW = fullWidth - hPad * 2;

    let totalDots = 0;
    let filledDots = 0;
    let currentDot = -1;

    if (config.type === 'life') {
      totalDots = (config.lifespan || 80) * 52;
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

    const widgetH = Math.round(fullHeight * 0.13);
    const safeTop = Math.round(fullHeight * 0.33) + (config.widgetPosition === 'top' ? widgetH : 0);
    const safeBot = Math.round(fullHeight * 0.12) + (config.widgetPosition === 'bottom' ? widgetH : 0);
    const statsAreaH = Math.round(fullHeight * 0.055);
    const usableH = fullHeight - safeTop - safeBot - statsAreaH;

    // Equal-gap grid sizing: scan for largest square cellSize
    // horizGap === vertGap === (cellSize - dotSize)
    let columns: number;
    let cellSize: number;

    if (config.type === 'life') {
      columns = 52;
      const cellByW = Math.floor(availW / columns);
      const lifeTotalRows = Math.ceil(totalDots / columns);
      const cellByH = Math.floor(usableH / lifeTotalRows);
      cellSize = Math.min(cellByW, cellByH);
    } else {
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
    const dotSize = Math.floor(cellSize * 0.78);
    const gap = cellSize - dotSize; // same for both H and V
    const horizGap = gap;
    const vertGap = gap;
    const gridW = columns * dotSize + (columns - 1) * gap;
    const gridH = totalRows * dotSize + (totalRows - 1) * gap;
    const topOffset = safeTop + Math.max(0, Math.floor((usableH - gridH) / 2));
    const leftOffset = hPad + Math.max(0, Math.floor((availW - gridW) / 2));

    // Event map
    const eventMap = new Map<number, string>();
    if (config.lifeEvents && config.birthday) {
      for (const evt of config.lifeEvents) {
        const weekIdx = lifeEventWeekIndex(config.birthday, evt.date);
        eventMap.set(weekIdx, evt.icon);
      }
    }

    return {
      columns, dotSize, horizGap, vertGap, gridW, totalDots, filledDots, currentDot,
      totalRows, topOffset, leftOffset, eventMap,
    };
  }, [config]);

  const {
    columns, dotSize, horizGap, vertGap, gridW, totalDots, filledDots, currentDot,
    totalRows, topOffset, leftOffset, eventMap,
  } = gridData;

  const cssDotSize = Math.max(1, Math.round(dotSize * canvasScale));
  const cssGap = Math.max(0.5, horizGap * canvasScale); // same for H and V
  const cssHorizGap = cssGap;
  const cssVertGap = cssGap;
  const cssCellW = cssDotSize + cssGap;
  const cssTopOffset = Math.round(topOffset * canvasScale);
  const cssLeftOffset = Math.round(leftOffset * canvasScale);
  const hitTargetSize = Math.max(8, cssCellW);

  const EVENT_EMOJI: Record<string, string> = {
    heart: '❤️', star: '⭐', leaf: '🍃', flower: '🌸', moon: '🌙', snow: '❄️',
  };

  function getBorderRadius(shape: string): string {
    switch (shape) {
      case 'circle': return '50%';
      case 'rounded': return `${Math.round(cssDotSize * 0.28)}px`;
      case 'diamond': return '30% 0';
      default: return '2px';
    }
  }

  const rows: React.ReactElement[] = [];
  for (let row = 0; row < totalRows; row++) {
    const dots: React.ReactElement[] = [];
    for (let col = 0; col < columns; col++) {
      const idx = row * columns + col;
      if (idx >= totalDots) break;

      const isEvent = eventMap.has(idx);
      const isFilled = idx < filledDots;
      const isCurrent = idx === currentDot;

      let bgColor: string;
      let opacity: number;

      if (isEvent) {
        bgColor = 'FFD700';
        opacity = 100;
      } else if (config.gradientMode && config.gradientStart && config.gradientEnd) {
        const t = totalDots > 1 ? idx / (totalDots - 1) : 0;
        bgColor = lerpHex(config.gradientStart, config.gradientEnd, t);
        opacity = isFilled ? config.dotFilledOpacity : config.dotEmptyOpacity;
      } else if (isCurrent) {
        bgColor = config.dotCurrent;
        opacity = 100;
      } else if (isFilled) {
        bgColor = config.dotFilled;
        opacity = config.dotFilledOpacity;
      } else {
        bgColor = config.dotEmpty;
        opacity = config.dotEmptyOpacity;
      }

      const borderRadius = getBorderRadius(config.dotShape);
      let shadow: string | undefined;
      if (config.dotStyle === 'glow') shadow = `0 0 ${Math.max(2, cssDotSize * 0.3)}px ${hexToRgba(bgColor, opacity)}`;
      if (config.dotStyle === 'neon') shadow = `0 0 ${Math.max(2, cssDotSize * 0.3)}px ${hexToRgba(bgColor, opacity)}, 0 0 ${Math.max(4, cssDotSize * 0.6)}px ${hexToRgba(bgColor, opacity)}`;

      const dotStyle: React.CSSProperties = isCurrent && !isEvent
        ? {
            // Solid accent dot for today (matches reference)
            width: cssDotSize,
            height: cssDotSize,
            borderRadius,
            background: hexToRgba(config.dotCurrent, 100),
            ...(shadow ? { boxShadow: shadow } : {}),
          }
        : config.dotStyle === 'outlined' && !isFilled && !isEvent
        ? {
            width: cssDotSize,
            height: cssDotSize,
            borderRadius,
            border: `1px solid ${hexToRgba(bgColor, opacity)}`,
            background: 'transparent',
          }
        : {
            width: cssDotSize,
            height: cssDotSize,
            borderRadius,
            background: hexToRgba(bgColor, opacity),
            ...(shadow ? { boxShadow: shadow } : {}),
          };

      dots.push(
        <div
          key={idx}
          onClick={(e) => {
            e.stopPropagation();
            onDotClick?.(idx);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: hitTargetSize,
            height: hitTargetSize,
            cursor: onDotClick ? 'pointer' : 'default',
          }}
          title={`Dot ${idx}`}
        >
          {isEvent ? (
            // Render emoji icon to match the PNG output (which uses SVG symbols)
            <div style={{
              width: cssDotSize,
              height: cssDotSize,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: Math.max(8, cssDotSize * 0.9),
              lineHeight: 1,
            }}>
              {EVENT_EMOJI[eventMap.get(idx) || 'star'] || '⭐'}
            </div>
          ) : (
            <div style={dotStyle} />
          )}
        </div>
      );
    }
    const rowAlign = config.dotRowAlign || 'left';
    const justifyContent =
      rowAlign === 'right' ? 'flex-end' :
      rowAlign === 'center' ? 'center' : 'flex-start';
    const cssGridW = Math.round(gridW * canvasScale);

    rows.push(
      <div key={`row-${row}`} style={{ display: 'flex', flexDirection: 'row', gap: cssHorizGap, width: cssGridW, justifyContent }}>
        {dots}
      </div>
    );
  }

  // Suppress "unused" warnings
  void canvasWidth;
  void canvasHeight;

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 100, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', top: cssTopOffset, left: cssLeftOffset, display: 'flex', flexDirection: 'column', gap: cssVertGap, pointerEvents: 'auto' }}>
        {rows}
      </div>
    </div>
  );
}
