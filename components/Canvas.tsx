'use client';

import React, { useMemo } from 'react';
import { WallpaperConfig, PhotoLayer } from '@/types';
import DotGrid from './DotGrid';
import CanvasLayer from './CanvasLayer';

// Build today's date string for the iOS overlay
function getTodayLabel(): string {
  const d = new Date();
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function getTimeLabel(): string {
  const d = new Date();
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false });
}

interface CanvasProps {
  config: WallpaperConfig;
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateLayer: (id: string, updates: Partial<PhotoLayer>) => void;
  onDragEnd: () => void;
  onDotClick?: (weekIndex: number) => void;
}

// Phone frame image: 1419×2796px
// The iPhone screen (1179×2556) is embedded with a uniform 120px margin on all 4 sides:
//   screen = (120,120) → (120+1179, 120+2556) = (1299, 2676)
// NOTE: the alpha scan picked up the physical side-buttons (power/volume) as opaque pixels
//       at x≈70-119 (left volume) and x≈1346 (right power button) — those are NOT screen edges.
const FRAME_IMG_W  = 1419;
const FRAME_IMG_H  = 2796;
const SCREEN_PX_L  = 120;          // screen left  (uniform 120px margin)
const SCREEN_PX_R  = 120 + 1179;   // = 1299
const SCREEN_PX_T  = 120;          // screen top
const SCREEN_PX_B  = 120 + 2556;   // = 2676

// Display the frame at DISPLAY_FRAME_W css-px wide; everything else derived
const DISPLAY_FRAME_W = 350;

export default function Canvas({
  config,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  onDragEnd,
  onDotClick,
}: CanvasProps) {
  // Frame display dimensions — scale factor from native to CSS px
  const frameW    = DISPLAY_FRAME_W;
  const frameH    = Math.round(FRAME_IMG_H * (DISPLAY_FRAME_W / FRAME_IMG_W));
  const displayScale = DISPLAY_FRAME_W / FRAME_IMG_W;

  // Screen area in CSS px — derived directly from measured pixel positions
  const bezelLeft = Math.round(SCREEN_PX_L * displayScale);
  const bezelTop  = Math.round(SCREEN_PX_T * displayScale);
  const screenW   = Math.round((SCREEN_PX_R - SCREEN_PX_L) * displayScale);
  const screenH   = Math.round((SCREEN_PX_B - SCREEN_PX_T) * displayScale);

  // Canvas fills the screen WIDTH exactly; height follows the wallpaper aspect ratio.
  // canvasHeight may slightly exceed screenH (wallpaper taller than frame screen) — that's
  // fine, it gets clipped by overflow:hidden. Never shorter → no top/bottom gaps.
  const canvasWidth  = screenW;
  const canvasScale  = canvasWidth / config.width;
  const canvasHeight = useMemo(
    () => Math.round(canvasWidth * config.height / config.width),
    [canvasWidth, config.width, config.height]
  );

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

        {/* iOS lock screen UI overlay — makes preview match real lock screen */}
        <div
          style={{
            position: 'absolute',
            top: bezelTop,
            left: bezelLeft,
            width: canvasWidth,
            height: screenH,
            pointerEvents: 'none',
            zIndex: 150,
            overflow: 'hidden',
          }}
        >
          {/* Dynamic Island pill */}
          <div style={{
            position: 'absolute', top: 8, left: '50%',
            transform: 'translateX(-50%)',
            width: 80, height: 20,
            background: '#000', borderRadius: 12,
          }} />

          {/* Time — real iOS lock screen: clock top at ~20% of screen height */}
          <div style={{
            position: 'absolute',
            top: '20%', width: '100%', textAlign: 'center',
            color: 'rgba(255,255,255,0.92)',
            fontSize: Math.round(canvasWidth * 0.20),
            fontWeight: 300,
            letterSpacing: -1,
            textShadow: '0 1px 8px rgba(0,0,0,0.6)',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          }}>
            {getTimeLabel()}
          </div>

          {/* Date — real iOS: just below the clock, at ~30% of screen height */}
          <div style={{
            position: 'absolute',
            top: '30%', width: '100%', textAlign: 'center',
            color: 'rgba(255,255,255,0.80)',
            fontSize: Math.round(canvasWidth * 0.042),
            fontWeight: 400,
            textShadow: '0 1px 6px rgba(0,0,0,0.6)',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          }}>
            {getTodayLabel()}
          </div>

          {/* Flashlight button — bottom left, below the dot grid */}
          <div style={{
            position: 'absolute', bottom: '5%', left: '10%',
            width: Math.round(canvasWidth * 0.14), height: Math.round(canvasWidth * 0.14),
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.18)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 3, height: 14, background: 'rgba(255,255,255,0.7)', borderRadius: 2 }} />
          </div>

          {/* Camera button — bottom right, below the dot grid */}
          <div style={{
            position: 'absolute', bottom: '5%', right: '10%',
            width: Math.round(canvasWidth * 0.14), height: Math.round(canvasWidth * 0.14),
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.18)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 16, height: 14,
              border: '2px solid rgba(255,255,255,0.7)',
              borderRadius: 3,
            }} />
          </div>

          {/* Home indicator */}
          <div style={{
            position: 'absolute', bottom: '2%', left: '50%',
            transform: 'translateX(-50%)',
            width: 60, height: 4,
            background: 'rgba(255,255,255,0.4)', borderRadius: 3,
          }} />
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
