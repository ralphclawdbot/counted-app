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
    const columns = config.type === 'life' ? 52 : 25;
    const hPad = Math.round(fullWidth * 0.05);
    const availW = fullWidth - hPad * 2;
    const cellW = availW / columns;
    const dotSize = Math.floor(cellW * 0.55);
    const gap = cellW - dotSize;

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

    const totalRows = Math.ceil(totalDots / columns);
    const safeTop = Math.round(fullHeight * 0.12);
    const safeBot = Math.round(fullHeight * 0.06);
    const usable = fullHeight - safeTop - safeBot;
    const gridH = totalRows * dotSize + (totalRows - 1) * gap;
    const topOffset = safeTop + Math.max(0, Math.floor((usable - gridH) / 2));

    // Event map
    const eventMap = new Map<number, string>();
    if (config.lifeEvents && config.birthday) {
      for (const evt of config.lifeEvents) {
        const weekIdx = lifeEventWeekIndex(config.birthday, evt.date);
        eventMap.set(weekIdx, evt.icon);
      }
    }

    return {
      columns, dotSize, gap, totalDots, filledDots, currentDot,
      totalRows, topOffset, eventMap, cellW,
    };
  }, [config]);

  const {
    columns, dotSize, gap, totalDots, filledDots, currentDot,
    totalRows, topOffset, eventMap, cellW,
  } = gridData;

  const cssDotSize = Math.max(1, Math.round(dotSize * canvasScale));
  const cssGap = Math.max(0.5, gap * canvasScale);
  const cssCellW = Math.max(cssDotSize, Math.round(cellW * canvasScale));
  const cssTopOffset = Math.round(topOffset * canvasScale);
  const hitTargetSize = Math.max(8, cssCellW);

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
            width: cssDotSize,
            height: cssDotSize,
            borderRadius,
            border: `${Math.max(1, Math.round(2 * canvasScale))}px solid ${hexToRgba(config.dotCurrent, 100)}`,
            background: 'transparent',
            boxSizing: 'border-box',
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
          <div style={dotStyle} />
        </div>
      );
    }
    rows.push(
      <div key={`row-${row}`} style={{ display: 'flex', flexDirection: 'row', gap: cssGap }}>
        {dots}
      </div>
    );
  }

  // Suppress "unused" warnings
  void canvasWidth;
  void canvasHeight;

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 100, pointerEvents: 'none' }}>
      <div style={{ height: cssTopOffset }} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: cssGap, pointerEvents: 'auto' }}>
        {rows}
      </div>
    </div>
  );
}
