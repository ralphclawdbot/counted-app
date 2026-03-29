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
          {/* ── iOS 26 Lock Screen Layout ─────────────────────────────────────
               Reference: date above time, ultra-thin large clock, buttons at bottom
               Percentages measured from Arthur's iOS 26 reference screenshot          ── */}

          {/* Status bar — signal dots + wifi + battery (top right) */}
          <div style={{
            position: 'absolute', top: '3%', right: '5%',
            display: 'flex', alignItems: 'center', gap: 3,
          }}>
            {/* Signal dots (4 bars) */}
            {[0.4,0.6,0.8,1].map((op, i) => (
              <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: `rgba(255,255,255,${op})` }} />
            ))}
            {/* WiFi symbol (3 nested arcs via border trick) */}
            <div style={{ width: 10, height: 7, marginLeft: 2, position: 'relative' }}>
              <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 10, height: 10, border: '1.5px solid rgba(255,255,255,0.8)', borderRadius: '50%', clipPath: 'polygon(0 0,100% 0,100% 55%,0 55%)' }} />
              <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 6, height: 6, border: '1.5px solid rgba(255,255,255,0.8)', borderRadius: '50%', clipPath: 'polygon(0 0,100% 0,100% 55%,0 55%)' }} />
              <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 2.5, height: 2.5, background: 'rgba(255,255,255,0.8)', borderRadius: '50%' }} />
            </div>
            {/* Battery */}
            <div style={{ marginLeft: 2, position: 'relative', width: 20, height: 10, border: '1.5px solid rgba(255,255,255,0.7)', borderRadius: 2.5 }}>
              <div style={{ position: 'absolute', right: -4, top: '50%', transform: 'translateY(-50%)', width: 3, height: 5, background: 'rgba(255,255,255,0.5)', borderRadius: '0 1.5px 1.5px 0' }} />
              <div style={{ margin: 1, width: '60%', height: 'calc(100% - 2px)', background: 'rgba(255,255,255,0.75)', borderRadius: 1 }} />
            </div>
          </div>

          {/* Dynamic Island pill (top center) */}
          <div style={{
            position: 'absolute', top: '2%', left: '50%',
            transform: 'translateX(-50%)',
            width: 72, height: 18,
            background: '#000', borderRadius: 12,
          }} />

          {/* Lock icon (padlock) — ~8.5% from top, centered */}
          <div style={{
            position: 'absolute', top: '7.5%', width: '100%',
            textAlign: 'center', fontSize: 14, color: 'rgba(255,255,255,0.75)',
            textShadow: '0 1px 4px rgba(0,0,0,0.5)',
          }}>🔒</div>

          {/* Date — iOS 26: ABOVE the time, ~11% from top */}
          <div style={{
            position: 'absolute',
            top: '11%', width: '100%', textAlign: 'center',
            color: 'rgba(255,255,255,0.85)',
            fontSize: Math.round(canvasWidth * 0.050),
            fontWeight: 400,
            letterSpacing: 0.2,
            textShadow: '0 1px 6px rgba(0,0,0,0.5)',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          }}>
            {getTodayLabel()}
          </div>

          {/* Time — iOS 26: huge ultra-thin font, ~14% from top */}
          <div style={{
            position: 'absolute',
            top: '14.5%', width: '100%', textAlign: 'center',
            color: 'rgba(255,255,255,0.92)',
            fontSize: Math.round(canvasWidth * 0.27),
            fontWeight: 200,
            letterSpacing: -2,
            textShadow: '0 2px 12px rgba(0,0,0,0.4)',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            lineHeight: 1,
          }}>
            {getTimeLabel()}
          </div>

          {/* Flashlight button — bottom left, iOS 26 frosted glass style */}
          {(() => {
            const btnSize = Math.round(canvasWidth * 0.16);
            return (
              <div style={{
                position: 'absolute', bottom: '8%', left: '8%',
                width: btnSize, height: btnSize, borderRadius: '50%',
                background: 'rgba(255,255,255,0.20)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {/* Flashlight icon: handle + beam */}
                <svg width={btnSize * 0.42} height={btnSize * 0.42} viewBox="0 0 20 20" fill="none">
                  <rect x="7" y="11" width="6" height="8" rx="1.5" fill="rgba(255,255,255,0.85)" />
                  <polygon points="7,11 13,11 11,3 9,3" fill="rgba(255,255,255,0.85)" />
                  <rect x="8.5" y="13" width="3" height="1.5" rx="0.5" fill="rgba(0,0,0,0.3)" />
                </svg>
              </div>
            );
          })()}

          {/* Camera button — bottom right, iOS 26 frosted glass style */}
          {(() => {
            const btnSize = Math.round(canvasWidth * 0.16);
            return (
              <div style={{
                position: 'absolute', bottom: '8%', right: '8%',
                width: btnSize, height: btnSize, borderRadius: '50%',
                background: 'rgba(255,255,255,0.20)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {/* Camera icon: lens + body */}
                <svg width={btnSize * 0.46} height={btnSize * 0.46} viewBox="0 0 22 22" fill="none">
                  <rect x="1" y="6" width="20" height="14" rx="3" fill="rgba(255,255,255,0.85)" />
                  <circle cx="11" cy="13" r="4" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" fill="none" />
                  <circle cx="11" cy="13" r="2" fill="rgba(0,0,0,0.25)" />
                  <rect x="7" y="3" width="4" height="3" rx="1" fill="rgba(255,255,255,0.85)" />
                  <circle cx="17.5" cy="9" r="1" fill="rgba(0,0,0,0.3)" />
                </svg>
              </div>
            );
          })()}

          {/* Home indicator */}
          <div style={{
            position: 'absolute', bottom: '1.5%', left: '50%',
            transform: 'translateX(-50%)',
            width: 100, height: 4,
            background: 'rgba(255,255,255,0.5)', borderRadius: 3,
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
