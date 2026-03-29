'use client';

import React, { useMemo } from 'react';
import { WallpaperConfig, PhotoLayer } from '@/types';
import { DEVICES } from '@/lib/devices';
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

// Frame display width in CSS px — all other dimensions derived per-device
const DISPLAY_FRAME_W = 350;

export default function Canvas({
  config,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  onDragEnd,
  onDotClick,
}: CanvasProps) {
  // Resolve the device frame — falls back to first device if not found
  const device = useMemo(
    () => DEVICES.find((d) => d.name === config.deviceName) ?? DEVICES[3],
    [config.deviceName]
  );
  const frame = device.frame;

  // Scale the frame image to DISPLAY_FRAME_W css-px wide
  const displayScale = DISPLAY_FRAME_W / frame.fw;
  const frameW   = DISPLAY_FRAME_W;
  const frameH   = Math.round(frame.fh * displayScale);

  // Screen area in CSS px — directly from per-device pixel measurements
  const bezelLeft = Math.round(frame.scl * displayScale);
  const bezelTop  = Math.round(frame.sct * displayScale);
  const screenW   = Math.round((frame.scr - frame.scl) * displayScale);
  const screenH   = Math.round((frame.scb - frame.sct) * displayScale);

  // Canvas fills the screen WIDTH exactly; height from wallpaper aspect ratio.
  // If canvasHeight > screenH the overflow is clipped — no gaps.
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

          {/* Lock icon — simple white filled padlock (SF Symbol lock.fill) */}
          <div style={{
            position: 'absolute', top: '9%', width: '100%',
            display: 'flex', justifyContent: 'center',
          }}>
            <svg width="14" height="17" viewBox="0 0 28 34" fill="none">
              {/* Shackle arch */}
              <path d="M6 14V9C6 4.6 9.6 1 14 1s8 3.6 8 8v5" stroke="rgba(255,255,255,0.9)" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
              {/* Lock body */}
              <rect x="1" y="14" width="26" height="19" rx="5" fill="rgba(255,255,255,0.9)"/>
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

          {/* Time — iOS 26: large, thin strokes, fills screen width */}
          <div style={{
            position: 'absolute',
            top: '17%', width: '100%', textAlign: 'center',
            color: '#ffffff',
            fontSize: Math.round(canvasWidth * 0.43),
            fontWeight: 200,
            letterSpacing: -4,
            fontFamily: '"Helvetica Neue", -apple-system, BlinkMacSystemFont, sans-serif',
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
                  /* flashlight.on.fill — torch body + angled head + glow tip */
                  <svg width={btnSize * 0.40} height={btnSize * 0.48} viewBox="0 0 20 26" fill="white">
                    {/* Glow head (wide trapezoid at top) */}
                    <path d="M3 8 Q10 0 17 8 L15 12 L5 12 Z" />
                    {/* Body cylinder */}
                    <rect x="5.5" y="12" width="9" height="10" rx="2" />
                    {/* End cap */}
                    <rect x="6.5" y="22" width="7" height="3" rx="1.5" />
                    {/* Lens dot */}
                    <circle cx="10" cy="9" r="2" fill="rgba(0,0,0,0.25)" />
                  </svg>
                ) : (
                  /* camera.fill — body + lens bump + circle */
                  <svg width={btnSize * 0.48} height={btnSize * 0.40} viewBox="0 0 26 20" fill="white">
                    {/* Viewfinder bump */}
                    <rect x="9" y="0" width="8" height="4" rx="2" />
                    {/* Camera body */}
                    <rect x="0" y="3" width="26" height="17" rx="4" />
                    {/* Lens ring (dark cutout) */}
                    <circle cx="13" cy="11.5" r="5" fill="rgba(50,50,50,0.7)" />
                    <circle cx="13" cy="11.5" r="3" fill="rgba(30,30,30,0.8)" />
                    {/* Flash dot top right */}
                    <circle cx="22" cy="7" r="1.5" fill="rgba(50,50,50,0.6)" />
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

        {/* Phone frame — switches with the selected device */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={frame.path}
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
