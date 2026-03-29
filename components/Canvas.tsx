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
          {/* ── iOS 26 Lock Screen — pixel-matched to reference screenshot ──
               Layout: [DI pill] + [status bar right of DI] on same row
                       lock icon → date → huge thin time → (content) → buttons      */}

          {/* Top row: Dynamic Island centered + status bar to its right */}
          <div style={{
            position: 'absolute', top: '2%', left: 0, right: 0,
            height: Math.round(screenH * 0.04),
            display: 'flex', alignItems: 'center',
            padding: `0 ${Math.round(canvasWidth * 0.04)}px`,
          }}>
            {/* Left spacer (mirror of status bar width) */}
            <div style={{ flex: 1 }} />

            {/* Dynamic Island pill */}
            <div style={{
              width: Math.round(canvasWidth * 0.26),
              height: Math.round(screenH * 0.032),
              background: '#000', borderRadius: 99,
              flexShrink: 0,
            }} />

            {/* Status bar — right of DI, vertically centered with pill */}
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center',
              justifyContent: 'flex-end', gap: 3,
              paddingLeft: 6,
            }}>
              {/* Signal: 4 rounded bars increasing in height (SF-style) */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1.5 }}>
                {[0.25,0.45,0.65,0.85].map((op, i) => (
                  <div key={i} style={{
                    width: 3, borderRadius: 1,
                    height: 4 + i * 2,
                    background: `rgba(255,255,255,${op})`,
                  }} />
                ))}
              </div>
              {/* WiFi — 3 concentric arcs (SF Symbol style) */}
              <svg width="12" height="9" viewBox="0 0 24 18" fill="none" style={{ marginLeft: 1 }}>
                <path d="M1 7 Q12 -1 23 7" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                <path d="M5 12 Q12 6 19 12" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                <circle cx="12" cy="17" r="2.5" fill="rgba(255,255,255,0.9)"/>
              </svg>
              {/* Battery — outline + fill + nub */}
              <svg width="22" height="11" viewBox="0 0 44 22" fill="none" style={{ marginLeft: 1 }}>
                <rect x="1" y="1" width="37" height="20" rx="5" stroke="rgba(255,255,255,0.7)" strokeWidth="2" fill="none"/>
                <rect x="3" y="3" width="24" height="16" rx="3" fill="rgba(255,255,255,0.85)"/>
                <path d="M40 8 Q44 8 44 11 Q44 14 40 14" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          {/* Lock icon — SF Symbol "lock.fill" style SVG, golden, centered */}
          <div style={{
            position: 'absolute', top: '9%', width: '100%',
            display: 'flex', justifyContent: 'center',
          }}>
            <svg width="15" height="18" viewBox="0 0 30 36" fill="none">
              {/* Shackle */}
              <path d="M7 16V10a8 8 0 0 1 16 0v6" stroke="#e8c547" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
              {/* Body */}
              <rect x="2" y="16" width="26" height="18" rx="6" fill="#d4a827"/>
              {/* Keyhole dot */}
              <circle cx="15" cy="25" r="3" fill="rgba(0,0,0,0.35)"/>
              <rect x="13.5" y="25" width="3" height="4.5" rx="1.5" fill="rgba(0,0,0,0.35)"/>
            </svg>
          </div>

          {/* Date — centered, above time (~12% from top) */}
          <div style={{
            position: 'absolute',
            top: '13%', width: '100%', textAlign: 'center',
            color: 'rgba(255,255,255,0.88)',
            fontSize: Math.round(canvasWidth * 0.052),
            fontWeight: 400,
            letterSpacing: 0.1,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
          }}>
            {getTodayLabel()}
          </div>

          {/* Time — iOS 26 style: ultra-thin, fills ~85% of screen width */}
          <div style={{
            position: 'absolute',
            top: '17%', width: '100%', textAlign: 'center',
            color: 'rgba(255,255,255,0.94)',
            fontSize: Math.round(canvasWidth * 0.40),
            fontWeight: 100,
            letterSpacing: -3,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
            lineHeight: 1,
          }}>
            {getTimeLabel()}
          </div>

          {/* Flashlight + Camera buttons — frosted glass, bottom */}
          {(['left','right'] as const).map((side) => {
            const btnSize = Math.round(canvasWidth * 0.155);
            const isFlash = side === 'left';
            return (
              <div key={side} style={{
                position: 'absolute',
                bottom: '9%',
                [side]: Math.round(canvasWidth * 0.07),
                width: btnSize, height: btnSize, borderRadius: '50%',
                background: 'rgba(80,80,80,0.55)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {isFlash ? (
                  /* Flashlight SF-symbol approximation */
                  <svg width={btnSize * 0.44} height={btnSize * 0.44} viewBox="0 0 24 24" fill="none">
                    <path d="M9 2l-1 8H4l7 12V14h4L9 2z" fill="rgba(255,255,255,0.9)" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  /* Camera SF-symbol approximation */
                  <svg width={btnSize * 0.46} height={btnSize * 0.46} viewBox="0 0 24 24" fill="none">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" fill="none" strokeLinejoin="round"/>
                    <circle cx="12" cy="13" r="4" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" fill="none"/>
                  </svg>
                )}
              </div>
            );
          })}

          {/* Home indicator */}
          <div style={{
            position: 'absolute', bottom: '2%', left: '50%',
            transform: 'translateX(-50%)',
            width: Math.round(canvasWidth * 0.35), height: 4,
            background: 'rgba(255,255,255,0.55)', borderRadius: 3,
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
