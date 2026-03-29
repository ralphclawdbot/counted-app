'use client';

import React, { useMemo } from 'react';
import { WallpaperConfig, PhotoLayer } from '@/types';
import DotGrid from './DotGrid';
import CanvasLayer from './CanvasLayer';

interface CanvasProps {
  config: WallpaperConfig;
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateLayer: (id: string, updates: Partial<PhotoLayer>) => void;
  onDragEnd: () => void;
  onDotClick?: (weekIndex: number) => void;
}

// Phone frame image (iPhone 15 Pro Black, ~780×1560px)
// Screen area insets: 7% left/right, 5.5% top/bottom
const FRAME_SCREEN_INSET_H = 0.07;  // left + right each
const FRAME_SCREEN_INSET_V = 0.055; // top + bottom each
const FRAME_ASPECT = 1560 / 780;    // height / width of the frame image

export default function Canvas({
  config,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  onDragEnd,
  onDotClick,
}: CanvasProps) {
  // Canvas content is 300px wide → frame is sized so its screen area = 300px wide
  const canvasWidth = 300;
  const canvasScale = canvasWidth / config.width;
  const canvasHeight = useMemo(
    () => Math.round(canvasWidth * config.height / config.width),
    [config.width, config.height]
  );

  // Frame dimensions: screen area = canvasWidth → frame = canvasWidth / (1 - 2*inset_h)
  const frameW = Math.round(canvasWidth / (1 - 2 * FRAME_SCREEN_INSET_H));
  const frameH = Math.round(frameW * FRAME_ASPECT);
  const bezelLeft = Math.round(frameW * FRAME_SCREEN_INSET_H);
  const bezelTop  = Math.round(frameH * FRAME_SCREEN_INSET_V);
  const screenH   = Math.round(frameH * (1 - 2 * FRAME_SCREEN_INSET_V));

  const sortedLayers = useMemo(() => {
    if (!config.layers) return [];
    return [...config.layers].filter((l) => l.visible).sort((a, b) => a.zIndex - b.zIndex);
  }, [config.layers]);

  // BG dim overlay
  const hasBgLayer = config.layers?.some((l) => l.type === 'bg' && l.visible);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Phone mockup: real SwarmPost frame image, canvas inside the screen area */}
      <div style={{ position: 'relative', width: frameW, height: frameH, flexShrink: 0 }}>

        {/* Canvas content — positioned inside the screen area */}
        <div
          onClick={() => onSelectLayer(null)}
          style={{
            position: 'absolute',
            top: bezelTop,
            left: bezelLeft,
            width: canvasWidth,
            height: screenH,
            background: `#${config.bg}`,
            overflow: 'hidden',
          }}
        >
          {/* Photo layers */}
          {sortedLayers.map((layer) => (
            <CanvasLayer
              key={layer.id}
              layer={layer}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              canvasScale={canvasScale}
              isSelected={selectedLayerId === layer.id}
              onSelect={() => onSelectLayer(layer.id)}
              onUpdate={(updates) => onUpdateLayer(layer.id, updates)}
              onDragEnd={onDragEnd}
            />
          ))}

          {/* BG dim overlay */}
          {hasBgLayer && config.bgDim && config.bgDim > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: `rgba(0,0,0,${config.bgDim / 100})`,
                zIndex: 50,
                pointerEvents: 'none',
              }}
            />
          )}

          {/* BG blur visual indicator */}
          {hasBgLayer && config.bgBlur && config.bgBlur > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backdropFilter: `blur(${config.bgBlur * canvasScale}px)`,
                zIndex: 49,
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Dot grid */}
          <DotGrid
            config={config}
            canvasScale={canvasScale}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            onDotClick={onDotClick}
          />
        </div>

        {/* Real phone frame image — overlaid on top, non-interactive */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/phone-frame.png"
          alt=""
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: frameW,
            height: frameH,
            pointerEvents: 'none',
            zIndex: 200,
          }}
        />
      </div>
    </div>
  );
}
